import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { studentSchema } from "@universe/shared-validation";
import { AppDataSource } from "../data-source.js";
import { User } from "../entities/User.js";

export async function registerUser(input) {
  const payload = studentSchema.parse({ ...input, role: "student" });
  const repo = AppDataSource.getRepository(User);

  const existing = await repo.findOneBy({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = repo.create({
    email: payload.email.toLowerCase(),
    fullName: payload.fullName.trim(),
    passwordHash,
    role: payload.role,
    studentNumber: payload.studentNumber.trim(),
    programmeId: payload.programmeId,
    batchId: payload.batchId,
  });
  return repo.save(user);
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error("Email and password are required");
  const repo = AppDataSource.getRepository(User);
  const user = await repo
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .where("user.email = :email", { email: email.trim().toLowerCase() })
    .andWhere("user.isActive = :isActive", { isActive: true })
    .getOne();
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new Error("Incorrect email or password");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

  const token = jwt.sign(
    { userId: user.userId, role: user.roleCode },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
  await repo.update(user.userId, { lastLoginAt: new Date() });
  return {
    token,
    user: {
      id: user.userId,
      email: user.email,
      fullName: user.name,
      role: user.roleCode,
    },
  };
}
