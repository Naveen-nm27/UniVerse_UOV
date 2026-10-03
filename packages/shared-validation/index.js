import { z } from "zod";
export const positiveId = z.coerce.number().int().positive().max(4294967295);
export const date = z.iso.date();
const name = z.string().trim().min(1).max(255);
const password = z.string().min(8).max(72).refine((value) => new TextEncoder().encode(value).length <= 72, "Password must be at most 72 UTF-8 bytes");
export const loginSchema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(72) }).strict();
export const studentSchema = z.object({
  fullName: name, email: z.string().trim().email().max(255), password,
  role: z.literal("STUDENT"), registrationNumber: z.string().trim().min(1).max(50),
  batchId: positiveId, programmeId: positiveId, startDate: date,
  currentSemester: z.coerce.number().int().min(1).max(16).optional(),
  phone: z.string().trim().max(30).optional(),
}).strict();
export const userSchema = studentSchema;
export const passwordSchema = z.object({ currentPassword: z.string().min(1).max(72), password }).strict();
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(100).optional(),
}).strict();
