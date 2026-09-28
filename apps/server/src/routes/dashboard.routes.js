import { Router } from "express";

import { getDashboard } from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/authenticate.js";

import { requireRole } from "../middleware/require-role.js";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  requireRole("MA"),
  getDashboard
);

export default router;