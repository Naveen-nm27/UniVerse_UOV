import { z } from "zod";

export const lecturerFiltersSchema = z.object({
  semesterId: z.coerce.number().int().positive().optional(),
  offeringId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
});

export const lectureSessionSchema = z.object({
  offeringId: z.coerce.number().int().positive(),
  hallId: z.coerce.number().int().positive().optional().nullable(),
  sessionDate: z.string().optional(),
  openedBy: z.coerce.number().int().positive().optional(),
});
