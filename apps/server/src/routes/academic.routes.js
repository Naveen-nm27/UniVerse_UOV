import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";
import { positiveId, userQuerySchema } from "@universe/shared-validation";
import { catalog, list, create, update } from "../controllers/academic.controller.js";
import { requirePermission } from "../middleware/require-permission.js";
const router = Router();
router.use(authenticate, requireRole("MA"));
router.get("/resources", catalog);
router.get("/:resource", validate(userQuerySchema.omit({ q: true }), "query"), list);
router.post("/:resource", requirePermission("timetable.write"), create);
router.patch(
  "/:resource/:id",
  requirePermission("timetable.write"),
  validate(z.object({ resource: z.string(), id: positiveId }).strict(), "params"),
  update,
);
export default router;
