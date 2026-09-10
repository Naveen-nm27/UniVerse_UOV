import { z } from "zod";

const baseUserFields = {
  email: z.string().email(),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const studentSchema = z.object({
  ...baseUserFields,
  role: z.literal("student"),
  studentNumber: z.string().min(1),
  programmeId: z.string().uuid(),
  batchId: z.string().uuid(),
});

export const lecturerSchema = z.object({
  ...baseUserFields,
  role: z.literal("lecturer"),
  departmentId: z.string().uuid(),
  isHOD: z.boolean(),
});

export const administratorSchema = z.object({
  ...baseUserFields,
  role: z.literal("administrator"),
});

export const managementAssistantSchema = z.object({
  ...baseUserFields,
  role: z.literal("management_assistant"),
});

export const userSchema = z.discriminatedUnion("role", [
  studentSchema,
  lecturerSchema,
  administratorSchema,
  managementAssistantSchema,
]);
