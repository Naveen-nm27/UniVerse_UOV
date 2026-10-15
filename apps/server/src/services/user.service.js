import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";
import { dashboardPaths, getJwtSecret, sessionUser, sessionVersion } from "../config/auth.js";
import { ApiError } from "../utils/api-error.js";
import { appendAuditLog } from "./audit.service.js";

export async function loginUser(email, password) {
  const repo = AppDataSource.getRepository("User");
  const user = await repo
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .where("user.email = :email", { email: email.trim().toLowerCase() })
    .getOne();
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  if (!dashboardPaths[user.roleCode])
    throw new ApiError(403, "UNSUPPORTED_ROLE", "This account role is not supported.");
  const token = jwt.sign({ credentialVersion: sessionVersion(user.passwordHash) }, getJwtSecret(), {
    subject: String(user.userId),
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
  await repo.update(user.userId, { lastLoginAt: new Date() });
  return { token, user: sessionUser(user) };
}
export async function listUsers({ page, pageSize, q }) {
  const query = AppDataSource.getRepository("User")
    .createQueryBuilder("u")
    .select(["u.userId", "u.name", "u.email", "u.roleCode", "u.isActive", "u.mustChangePassword"]);
  if (q) query.where("u.name LIKE :q OR u.email LIKE :q", { q: `%${q}%` });
  const [users, total] = await query
    .orderBy("u.userId", "DESC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();
  return {
    data: users.map((u) => ({ ...sessionUser(u), isActive: u.isActive })),
    meta: { page, pageSize, total },
  };
}
export async function createStudent(input, actorId) {
  return createUser({ ...input, role: "STUDENT" }, actorId);
}
export async function createUser(input, actorId) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return AppDataSource.transaction(async (manager) => {
    if (!(await manager.getRepository("MaStaff").existsBy({ userId: actorId })))
      throw new ApiError(
        403,
        "MA_PROFILE_REQUIRED",
        "An active Management Assistant profile is required.",
      );
    if (input.role === "STUDENT") {
      const batch = await manager.getRepository("Batch").findOneBy({ batchId: input.batchId });
      const programme = await manager
        .getRepository("Programme")
        .findOneBy({ programmeId: input.programmeId });
      if (!batch || !programme)
        throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing batch and programme.");
      if (input.currentSemester && input.currentSemester > programme.durationYears * 2)
        throw new ApiError(
          400,
          "INVALID_SEMESTER",
          "The current semester exceeds the programme duration.",
        );
    }
    if (
      input.departmentId &&
      !(await manager.getRepository("Department").existsBy({ departmentId: input.departmentId }))
    )
      throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing department.");
    if (input.role === "HOD") {
      const department = await manager.getRepository("Department").findOne({
        where: { departmentId: input.departmentId },
        lock: { mode: "pessimistic_write" },
      });
      if (department.headLecturerId)
        throw new ApiError(409, "HOD_EXISTS", "This department already has a head.");
    }
    const repo = manager.getRepository("User");
    const user = await repo.save(
      repo.create({
        name: input.fullName,
        email: input.email.toLowerCase(),
        passwordHash,
        roleCode: input.role,
        phone: input.phone || null,
        isActive: true,
        mustChangePassword: true,
        createdBy: actorId,
      }),
    );
    if (input.role === "STUDENT") {
      await manager.getRepository("Student").save({
        userId: user.userId,
        registrationNumber: input.registrationNumber,
        batchId: input.batchId,
        currentSemester: input.currentSemester ?? null,
      });
      await manager.getRepository("StudentProgramme").save({
        studentId: user.userId,
        programmeId: input.programmeId,
        startDate: input.startDate,
        status: "active",
      });
    } else if (["LECTURER", "HOD"].includes(input.role)) {
      await manager.getRepository("Lecturer").save({
        userId: user.userId,
        departmentId: input.departmentId,
        dateJoined: input.dateJoined,
        staffNumber: input.staffNumber || null,
        isHod: input.role === "HOD",
      });
      if (input.role === "HOD")
        await manager
          .getRepository("Department")
          .update(input.departmentId, { headLecturerId: user.userId });
    } else if (input.role === "DEAN")
      await manager.getRepository("Dean").save({
        userId: user.userId,
        departmentId: input.departmentId,
        appointedAt: input.appointedAt,
      });
    else if (input.role === "MA")
      await manager.getRepository("MaStaff").save({
        userId: user.userId,
        staffNumber: input.staffNumber || null,
        officeName: input.officeName || null,
      });
    else
      await manager
        .getRepository("Administrator")
        .save({ userId: user.userId, adminLevel: input.adminLevel });
    await appendAuditLog(manager, "USERS", user.userId, "INSERT", actorId, null, {
      name: user.name,
      role: user.roleCode,
      isActive: true,
    });
    return sessionUser(user);
  });
}
export async function setUserActive(userId, isActive, actorId) {
  if (userId === actorId && !isActive)
    throw new ApiError(409, "SELF_DEACTIVATION", "You cannot deactivate your own account.");
  return AppDataSource.transaction(async (manager) => {
    if (!(await manager.getRepository("MaStaff").existsBy({ userId: actorId })))
      throw new ApiError(403, "MA_PROFILE_REQUIRED", "A Management Assistant profile is required.");
    const repo = manager.getRepository("User");
    const user = await repo.findOneBy({ userId });
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    const previousStatus = user.isActive;
    await repo.update(userId, { isActive });
    await appendAuditLog(
      manager,
      "USERS",
      userId,
      "UPDATE",
      actorId,
      { isActive: previousStatus },
      { isActive },
    );
    return { ...sessionUser(user), isActive };
  });
}
export async function changePassword(userId, currentPassword, password) {
  const repo = AppDataSource.getRepository("User");
  const user = await repo
    .createQueryBuilder("u")
    .addSelect("u.passwordHash")
    .where("u.userId = :userId", { userId })
    .getOne();
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new ApiError(400, "INVALID_PASSWORD", "The current password is incorrect.");
  if (currentPassword === password)
    throw new ApiError(400, "UNCHANGED_PASSWORD", "Choose a different password.");
  const passwordHash = await bcrypt.hash(password, 12);
  await repo.update(userId, {
    passwordHash,
    mustChangePassword: false,
  });
  const updated = { ...user, passwordHash, mustChangePassword: false };
  const token = jwt.sign({ credentialVersion: sessionVersion(passwordHash) }, getJwtSecret(), {
    subject: String(userId),
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
  return { token, user: sessionUser(updated) };
}
