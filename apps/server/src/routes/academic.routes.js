import { Router } from "express";

import {
  listDepartments,
  addDepartment,
  listProgrammes,
  addProgramme,
  listBatches,
  addBatch,
  listCalendarSemesters,
  addCalendarSemester,
  listProgrammeSemesters,
  addProgrammeSemester,
  listModules,
  addModule,
  listHalls,
  addHall,
} from "../controllers/academic.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

router.use(
  authenticate,
  requireRole("MA")
);

router.get("/departments", listDepartments);
router.post("/departments", addDepartment);

router.get("/programmes", listProgrammes);
router.post("/programmes", addProgramme);

router.get("/batches", listBatches);
router.post("/batches", addBatch);

router.get(
  "/calendar-semesters",
  listCalendarSemesters
);

router.post(
  "/calendar-semesters",
  addCalendarSemester
);

router.get(
  "/programme-semesters",
  listProgrammeSemesters
);

router.post(
  "/programme-semesters",
  addProgrammeSemester
);

router.get("/modules", listModules);
router.post("/modules", addModule);

router.get("/halls", listHalls);
router.post("/halls", addHall);

export default router;