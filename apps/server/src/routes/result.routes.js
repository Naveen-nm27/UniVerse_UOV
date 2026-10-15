import { Router } from "express";
import { z } from "zod";
import { positiveId } from "@universe/shared-validation";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { requirePermission } from "../middleware/require-permission.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../utils/api-error.js";
import { AppDataSource } from "../data-source.js";
import {
  enterFinal,
  enterIca,
  changeStatus,
  transitions,
} from "../services/result-workflow.service.js";
const router = Router(),
  grade = z.string().trim().min(1).max(2),
  status = z.enum(Object.keys(transitions));
router.use(authenticate, requireRole("MA"), async (req, res, next) => {
  if (!(await AppDataSource.getRepository("MaStaff").existsBy({ userId: req.auth.userId })))
    throw new ApiError(403, "MA_PROFILE_REQUIRED", "A Management Assistant profile is required.");
  next();
});
router.get("/transitions", requirePermission("results.status.update"), (req, res) =>
  res.json({ data: transitions }),
);
router.get("/offerings", requirePermission("grades.write"), async (req, res) => {
  const data =
    await AppDataSource.query(`SELECT mo.offering_id AS id,CONCAT(m.module_code,' · ',sem.academic_year,' · ',u.name) AS label
    FROM MODULE_OFFERINGS mo JOIN MODULES m ON m.module_id=mo.module_id JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id
    JOIN USERS u ON u.user_id=mo.lecturer_id ORDER BY sem.start_date DESC,mo.offering_id DESC`);
  res.json({ data });
});
router.get(
  "/entry-context/:offeringId",
  requirePermission("grades.write"),
  validate(z.object({ offeringId: positiveId }).strict(), "params"),
  async (req, res) => {
    const id = req.validated.offeringId;
    if (!(await AppDataSource.getRepository("ModuleOffering").existsBy({ offeringId: id })))
      throw new ApiError(404, "OFFERING_NOT_FOUND", "Offering not found.");
    const [enrollments, exams, icas, grades] = await Promise.all([
      AppDataSource.query(
        `SELECT e.enrollment_id AS id,CONCAT(s.registration_number,' · ',u.name,' · attempt ',e.attempt_number) AS label
      FROM ENROLLMENTS e JOIN STUDENTS s ON s.user_id=e.student_id JOIN USERS u ON u.user_id=s.user_id
      WHERE e.offering_id=? AND e.status<>'withdrawn' ORDER BY s.registration_number,e.attempt_number`,
        [id],
      ),
      AppDataSource.query(
        "SELECT exam_id AS id,exam_type AS label FROM EXAMS WHERE offering_id=? ORDER BY exam_id",
        [id],
      ),
      AppDataSource.query(
        "SELECT ica_id AS id,COALESCE(title,CONCAT('ICA ',ica_number)) AS label FROM MODULE_ICAS WHERE offering_id=? ORDER BY ica_number",
        [id],
      ),
      AppDataSource.query(
        "SELECT grade AS id,grade AS label FROM GRADE_SCALE ORDER BY grade_point DESC,grade",
      ),
    ]);
    res.json({ data: { enrollments, exams, icas, grades } });
  },
);
router.post(
  "/final-grades",
  requirePermission("grades.write"),
  validate(
    z
      .object({ enrollmentId: positiveId, examId: positiveId, examGrade: grade, finalGrade: grade })
      .strict(),
  ),
  async (req, res) => res.json({ data: await enterFinal(req.validated, req.auth.userId) }),
);
router.post(
  "/ica-grades",
  requirePermission("grades.write"),
  validate(z.object({ enrollmentId: positiveId, icaId: positiveId, grade }).strict()),
  async (req, res) => res.json({ data: await enterIca(req.validated, req.auth.userId) }),
);
router.post(
  "/:resultId/status",
  requirePermission("results.status.update"),
  validate(z.object({ resultId: positiveId }).strict(), "params"),
  validate(
    z
      .object({ fromStatus: status, toStatus: status, note: z.string().trim().max(500).optional() })
      .strict(),
  ),
  async (req, res) =>
    res.json({ data: await changeStatus(req.validated.resultId, req.validated, req.auth.userId) }),
);
export default router;
