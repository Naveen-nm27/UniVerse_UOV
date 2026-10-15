import bcrypt from "bcrypt";
import { z } from "zod";
import { AppDataSource, initializeDatabase } from "../src/data-source.js";
const inputSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(255),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine((value) => Buffer.byteLength(value) <= 72),
});
async function createMa() {
  const input = inputSchema.parse({
    email: process.env.MA_EMAIL,
    name: process.env.MA_NAME,
    password: process.env.MA_PASSWORD,
  });
  await initializeDatabase();
  const repo = AppDataSource.getRepository("User");
  if (await repo.existsBy({ email: input.email.toLowerCase() }))
    throw new Error("An account with this email already exists; no changes were made.");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await AppDataSource.transaction(async (manager) => {
    if (await manager.getRepository("MaStaff").count())
      throw new Error(
        "A bootstrap MA already exists. Create further accounts through the MA workspace.",
      );
    const account = await manager.getRepository("User").save({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      roleCode: "MA",
      isActive: true,
      mustChangePassword: true,
      createdBy: null,
    });
    await manager
      .getRepository("MaStaff")
      .save({ userId: account.userId, officeName: process.env.MA_OFFICE || null });
    return account;
  });
  console.log(
    `Created canonical MA account ${user.userId}. Sign in at / and change the temporary password.`,
  );
}
createMa()
  .catch((error) => {
    console.error(
      error.name === "ZodError"
        ? "Set valid MA_EMAIL, MA_NAME and MA_PASSWORD (12–72 UTF-8 bytes)."
        : "MA account setup failed; check the database schema and account uniqueness.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    delete process.env.MA_PASSWORD;
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });
