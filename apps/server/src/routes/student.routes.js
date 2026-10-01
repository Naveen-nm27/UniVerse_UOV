import { Router } from "express";

import { authenticate }
  from "../middleware/authenticate.js";

import { requireRole }
  from "../middleware/require-role.js";

import {
  dashboard,
  results,
  resultDetails,
  assessments,
  downloadResults
} from "../controllers/student.controller.js";

const router = Router();


router.use(authenticate);


router.use(
  requireRole("STUDENT")
);


router.get(
  "/dashboard",
  dashboard
);


router.get(
  "/results",
  results
);


router.get(
  "/results/:resultId",
  resultDetails
);


router.get(
  "/assessments",
  assessments
);


router.get(
  "/downloads/result-summary",
  downloadResults
);

export default router;
