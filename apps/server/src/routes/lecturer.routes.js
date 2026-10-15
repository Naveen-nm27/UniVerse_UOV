import { Router } from "express";
import { z } from "zod";
import { positiveId, date, userQuerySchema } from "@universe/shared-validation";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireLecturerProfile } from "../middleware/require-lecturer-profile.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../utils/api-error.js";
import * as service from "../services/lecturer.service.js";
const router = Router();
const query = userQuerySchema
  .omit({ q: true })
  .extend({
    semesterId: positiveId.optional(),
    offeringId: positiveId.optional(),
    search: z.string().trim().max(100).optional(),
    status: z
      .enum(["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "PUBLISHED", "RETURNED"])
      .optional(),
    from: date.optional(),
    to: date.optional(),
  })
  .refine(
    (q) =>
      !q.from ||
      !q.to ||
      (q.to >= q.from && Date.parse(q.to) - Date.parse(q.from) <= 93 * 86400000),
    "Choose a date range of at most 93 days",
  );
const id = (key) => validate(z.object({ [key]: positiveId }).strict(), "params");
const object = (method, key) => async (req, res) =>
  res.json({
    data: await service[method](req.auth.userId, key ? req.validated[key] : req.validated),
  });
const list = (method) => async (req, res) =>
  res.json(await service[method](req.auth.userId, req.validated));
router.use(authenticate, requireRole("LECTURER"), requireLecturerProfile);
router.get("/me", async (req, res) => res.json({ data: await service.profile(req.auth.userId) }));
router.get("/semesters", async (req, res) =>
  res.json({ data: await service.semesters(req.auth.userId) }),
);
router.get("/dashboard", validate(query, "query"), object("dashboard"));
router.get("/offerings", validate(query, "query"), list("offerings"));
router.get("/offerings/:offeringId", id("offeringId"), object("offering", "offeringId"));
router.get(
  "/offerings/:offeringId/students",
  id("offeringId"),
  validate(query, "query"),
  async (req, res) =>
    res.json(await service.students(req.auth.userId, req.validated.offeringId, req.validated)),
);
for (const name of ["assessments", "results"]) {
  router.get(
    `/${name}`,
    requirePermission("results.status.view"),
    validate(query, "query"),
    list(name),
  );
  router.get(
    `/offerings/:offeringId/${name}`,
    requirePermission("results.status.view"),
    id("offeringId"),
    validate(query, "query"),
    list(name),
  );
}
router.get("/timetable", validate(query, "query"), object("timetable"));
router.get("/sessions", validate(query, "query"), list("sessions"));
router.get("/sessions/:sessionId", id("sessionId"), object("session", "sessionId"));
router.get(
  "/sessions/:sessionId/attendance",
  id("sessionId"),
  validate(query, "query"),
  async (req, res) =>
    res.json(await service.attendance(req.auth.userId, req.validated.sessionId, req.validated)),
);
router.get(
  "/results/:resultId",
  requirePermission("results.status.view"),
  id("resultId"),
  object("result", "resultId"),
);
router.get(
  "/results/:resultId/history",
  requirePermission("results.status.view"),
  id("resultId"),
  object("history", "resultId"),
);
// V04 delegates session control to the hall terminal. No browser credentials or hardware protocol exist yet.
router.post(["/sessions", "/sessions/:sessionId/close"], () => {
  throw new ApiError(
    403,
    "SESSION_CONTROL_DISABLED",
    "Sessions are controlled by the authorised hall terminal. Device integration is not connected.",
  );
});
export default router;
