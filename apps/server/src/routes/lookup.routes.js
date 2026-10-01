import { Router } from "express";

import {
  roles,
  departments,
  programmes,
  batches,
  gradeScale,
} from "../controllers/lookups.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

router.use(
  authenticate,
  requireRole("MA")
);

router.get("/roles", roles);
router.get("/departments", departments);
router.get("/programmes", programmes);
router.get("/batches", batches);
router.get("/grade-scale", gradeScale);

export default router;