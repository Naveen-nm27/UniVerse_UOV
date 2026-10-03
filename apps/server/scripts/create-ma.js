import bcrypt from "bcrypt";
import { z } from "zod";
import { AppDataSource } from "../src/data-source.js";
const inputSchema = z.object({
  email: z.string().trim().email().max(255), name: z.string().trim().min(1).max(255),
  password: z.string().min(12).max(72).refine((value) => Buffer.byteLength(value) <= 72),
});
async function createMa() {
  const input = inputSchema.parse({ email: process.env.MA_EMAIL, name: process.env.MA_NAME, password: process.env.MA_PASSWORD });
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository("User");
  if (await repo.existsBy({ email: input.email.toLowerCase() })) throw new Error("An account with this email already exists; no changes were made.");
  const user = await repo.save(repo.create({ name: input.name, email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 12), roleCode: "MA", isActive: true, mustChangePassword: true }));
  console.log(`Created canonical MA account ${user.userId}. Sign in at / and change the temporary password.`);
}
createMa().catch((error) => { console.error(error.name === "ZodError" ? "Set valid MA_EMAIL, MA_NAME and MA_PASSWORD (12–72 UTF-8 bytes)." : "MA account setup failed; check the database schema and account uniqueness."); process.exitCode = 1; })
  .finally(async () => { delete process.env.MA_PASSWORD; if (AppDataSource.isInitialized) await AppDataSource.destroy(); });
