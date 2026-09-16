import bcrypt from "bcrypt";
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