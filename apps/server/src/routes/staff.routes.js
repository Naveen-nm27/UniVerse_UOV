import { Router } from "express";
import { z } from "zod";
import { userQuerySchema, positiveId } from "@universe/shared-validation";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { requirePermission } from "../middleware/require-permission.js";
import { validate } from "../middleware/validate.js";
import * as service from "../services/staff.service.js";
const router = Router();
const query = userQuerySchema.omit({ q: true }).extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "PUBLISHED", "RETURNED"]).optional(),
});
router.use(authenticate, requireRole("ADMIN", "HOD", "DEAN", "MA"));
router.get("/dashboard", async (req, res) =>
  res.json({ data: await service.staffDashboard(req.auth.userId, req.auth.role) }),
);
router.get(
  "/results",
  requirePermission("results.status.view"),
  validate(query, "query"),
  async (req, res) =>
    res.json(await service.staffResults(req.auth.userId, req.auth.role, req.validated)),
);
router.get(
  "/results/:resultId/history",
  requirePermission("results.status.view"),
  validate(z.object({ resultId: positiveId }).strict(), "params"),
  async (req, res) =>
    res.json({
      data: await service.staffHistory(req.auth.userId, req.auth.role, req.validated.resultId),
    }),
);
router.get("/audit", requireRole("ADMIN", "MA"), validate(query, "query"), async (req, res) =>
  res.json(await service.audit(req.validated)),
);
router.get("/ma-staff", requireRole("ADMIN"), validate(query, "query"), async (req, res) =>
  res.json(await service.maStaff(req.validated)),
);
export default router;
