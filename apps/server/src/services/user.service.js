import bcrypt from "bcrypt";
import { AppDataSource } from "../data-source.js";
import { User } from "../entities/User.js";

export async function registerUser({ email, password }) {
  const repo = AppDataSource.getRepository(User);

  const existing = await repo.findOneBy({ email });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ email, passwordHash });
  return repo.save(user);
}