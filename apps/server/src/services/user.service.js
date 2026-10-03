import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";
import { dashboardPaths, getJwtSecret, sessionUser } from "../config/auth.js";
import { ApiError } from "../utils/api-error.js";

export async function loginUser(email, password) {
  const repo = AppDataSource.getRepository("User");
  const user = await repo.createQueryBuilder("user").addSelect("user.passwordHash")
    .where("user.email = :email", { email: email.trim().toLowerCase() }).getOne();
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  if (!dashboardPaths[user.roleCode]) throw new ApiError(403, "UNSUPPORTED_ROLE", "This account role is not supported.");
  const token = jwt.sign({}, getJwtSecret(), {
    subject: String(user.userId), algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
  await repo.update(user.userId, { lastLoginAt: new Date() });
  return { token, user: sessionUser(user) };
}
export async function listUsers({ page, pageSize, q }) {
  const query = AppDataSource.getRepository("User").createQueryBuilder("u")
    .select(["u.userId", "u.name", "u.email", "u.roleCode", "u.isActive", "u.mustChangePassword"]);
  if (q) query.where("u.name LIKE :q OR u.email LIKE :q", { q: `%${q}%` });
  const [users, total] = await query.orderBy("u.userId", "DESC").skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
  return { data: users.map((u) => ({ ...sessionUser(u), isActive: u.isActive })), meta: { page, pageSize, total } };
}
export async function createStudent(input, actorId) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return AppDataSource.transaction(async (manager) => {
    const batch = await manager.getRepository("Batch").findOneBy({ batchId: input.batchId });
    const programme = await manager.getRepository("Programme").findOneBy({ programmeId: input.programmeId });
    if (!batch || !programme) throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing batch and programme.");
    const repo = manager.getRepository("User");
    const user = await repo.save(repo.create({ name: input.fullName, email: input.email.toLowerCase(),
      passwordHash, roleCode: "STUDENT", phone: input.phone || null, isActive: true,
      mustChangePassword: true, createdBy: actorId }));
    await manager.getRepository("Student").save({ userId: user.userId,
      registrationNumber: input.registrationNumber, batchId: input.batchId,
      currentSemester: input.currentSemester ?? null });
    await manager.getRepository("StudentProgramme").save({ studentId: user.userId,
      programmeId: input.programmeId, startDate: input.startDate, status: "active" });
    return sessionUser(user);
  });
}
export async function setUserActive(userId, isActive, actorId) {
  if (userId === actorId && !isActive) throw new ApiError(409, "SELF_DEACTIVATION", "You cannot deactivate your own account.");
  const repo = AppDataSource.getRepository("User");
  const user = await repo.findOneBy({ userId });
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
  await repo.update(userId, { isActive });
  return { ...sessionUser(user), isActive };
}
export async function changePassword(userId, currentPassword, password) {
  const repo = AppDataSource.getRepository("User");
  const user = await repo.createQueryBuilder("u").addSelect("u.passwordHash")
    .where("u.userId = :userId", { userId }).getOne();
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new ApiError(400, "INVALID_PASSWORD", "The current password is incorrect.");
  if (currentPassword === password) throw new ApiError(400, "UNCHANGED_PASSWORD", "Choose a different password.");
  await repo.update(userId, { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: false });
}
