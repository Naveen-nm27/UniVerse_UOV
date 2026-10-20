import { AppDataSource } from "../data-source.js";
import { getPassingGrades } from "./academic-calculation.policy.js";

export async function getStudentSubjects(userId, semesterId = null) {
  const rows = await AppDataSource.query(
    `WITH own_enrollments AS (
      SELECT e.enrollment_id AS enrollmentId, e.offering_id AS offeringId,
        e.attempt_number AS attemptNumber, m.module_id AS moduleId,
        m.module_code AS moduleCode, m.module_name AS moduleTitle,
        sem.semester_id AS semesterId, sem.academic_year AS academicYear, sem.semester_name AS semesterName,
        ROW_NUMBER() OVER (PARTITION BY m.module_id
          ORDER BY sem.start_date DESC, e.attempt_number DESC, e.enrollment_id DESC) AS attemptRank
      FROM ENROLLMENTS e
      JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
      JOIN MODULES m ON m.module_id=mo.module_id
      JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id
      WHERE e.student_id=?
    ), published AS (
      SELECT fr.enrollment_id, fr.final_grade,
        ROW_NUMBER() OVER (PARTITION BY fr.enrollment_id
          ORDER BY fr.published_at DESC, fr.result_id DESC) AS resultRank
      FROM FINAL_RESULTS fr
      JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id
      JOIN EXAMS ex ON ex.exam_id=fr.exam_id AND ex.offering_id=e.offering_id
      WHERE e.student_id=? AND fr.status='PUBLISHED'
    )
    SELECT own.*, fr.final_grade AS finalGrade, ica.ica_number AS icaNumber,
      ica.title AS icaTitle, ig.ica_grade_id IS NOT NULL AS icaDone,
      CASE WHEN fr.enrollment_id IS NOT NULL THEN ig.grade ELSE NULL END AS icaGrade
    FROM own_enrollments own
    LEFT JOIN published fr ON fr.enrollment_id=own.enrollmentId AND fr.resultRank=1
    LEFT JOIN MODULE_ICAS ica ON ica.offering_id=own.offeringId
    LEFT JOIN ICA_GRADES ig ON ig.ica_id=ica.ica_id AND ig.enrollment_id=own.enrollmentId
    ORDER BY own.moduleCode, own.attemptRank, ica.ica_number`,
    [userId, userId],
  );
  return mapStudentSubjects(rows, semesterId);
}

export function mapStudentSubjects(rows, semesterId = null, passingGrades = getPassingGrades()) {
  const subjects = new Map();
  for (const row of rows) {
    const id = Number(row.enrollmentId);
    if (!subjects.has(id))
      subjects.set(id, {
        enrollmentId: id,
        moduleId: Number(row.moduleId),
        attemptRank: Number(row.attemptRank),
        moduleCode: row.moduleCode,
        moduleTitle: row.moduleTitle,
        semesterLabel: `${row.academicYear} - ${row.semesterName}`,
        semesterId: Number(row.semesterId),
        attemptNumber: Number(row.attemptNumber),
        finalGrade: row.finalGrade ?? null,
        requiresResit:
          row.finalGrade == null || !passingGrades.length
            ? null
            : !passingGrades.includes(row.finalGrade),
        assessments: [1, 2, 3].map((number) => ({ number, grade: null, status: "Not recorded" })),
      });
    const assessment = subjects
      .get(id)
      .assessments.find((item) => item.number === Number(row.icaNumber));
    if (assessment) {
      assessment.title = row.icaTitle || `ICA ${assessment.number}`;
      assessment.grade = row.finalGrade != null ? (row.icaGrade ?? null) : null;
      assessment.status =
        assessment.grade != null
          ? "Released"
          : Number(row.icaDone)
            ? "Done · awaiting release"
            : "Not recorded";
    }
  }
  const modules = new Map();
  for (const attempt of subjects.values()) {
    if (!modules.has(attempt.moduleId)) modules.set(attempt.moduleId, []);
    modules.get(attempt.moduleId).push(attempt);
  }
  return [...modules.values()].flatMap((attempts) => {
    attempts.sort((a, b) => a.attemptRank - b.attemptRank);
    const selected = attempts.find(
      (attempt) => semesterId == null || attempt.semesterId === Number(semesterId),
    );
    if (!selected) return [];
    const latestReleased = attempts.find((attempt) => attempt.finalGrade != null);
    return [
      {
        ...selected,
        requiresResit: latestReleased?.requiresResit ?? null,
        resitGrade: latestReleased?.finalGrade ?? null,
        attemptHistory: attempts,
      },
    ];
  });
}
