import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { requireLecturerProfile } from "../middleware/require-lecturer-profile.js";
import {
  me,
  dashboard,
  offerings,
  offering,
  students,
  timetable,
  sessions,
  session,
  attendance,
  openSession,
  closeSession,
  assessments,
  results,
  result,
  resultHistory,
} from "../controllers/lecturer.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("LECTURER"));
router.use(requireLecturerProfile);

router.get("/me", me);
router.get("/dashboard", dashboard);
router.get("/offerings", offerings);
router.get("/offerings/:offeringId", offering);
router.get("/offerings/:offeringId/students", students);
router.get("/offerings/:offeringId/assessments", assessments);
router.get("/offerings/:offeringId/results", results);
router.get("/timetable", timetable);
router.get("/sessions", sessions);
router.get("/sessions/:sessionId", session);
router.get("/sessions/:sessionId/attendance", attendance);
router.get("/results/:resultId", result);
router.get("/results/:resultId/history", resultHistory);

router.post("/sessions", openSession);
router.post("/sessions/:sessionId/close", closeSession);

export default router;
