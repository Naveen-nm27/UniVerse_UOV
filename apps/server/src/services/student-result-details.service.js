import { AppDataSource } from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";
import { getStudyPeriod } from "./student-academic-period.service.js";
import { getAttemptHistory } from "./student-attempts.service.js";

export async function getResultDetails(
  userId,
  resultId
) {

  const rows = await AppDataSource.query(
    `
    SELECT

      fr.result_id AS resultId,

      e.enrollment_id AS enrollmentId,
      e.attempt_number AS attemptNumber,

      m.module_id AS moduleId,
      m.module_code AS moduleCode,
      m.module_name AS moduleTitle,
      m.credits AS credits,

      sem.semester_id AS semesterId,
      sem.semester_name AS semesterName,
      sem.academic_year AS academicYear,

      fr.final_grade AS finalGrade,

      gs.grade_point AS gradePoint,

      ex.exam_type AS examType,
      ex.is_resit AS isResit,
      ex.exam_date AS examDate

    FROM FINAL_RESULTS fr

    INNER JOIN ENROLLMENTS e
      ON e.enrollment_id = fr.enrollment_id

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id

    INNER JOIN MODULES m
      ON m.module_id = mo.module_id

    INNER JOIN SEMESTERS sem
      ON sem.semester_id = mo.semester_id

    INNER JOIN EXAMS ex
      ON ex.exam_id = fr.exam_id

    LEFT JOIN GRADE_SCALE gs
      ON gs.grade = fr.final_grade

    WHERE fr.result_id = ?

      AND e.student_id = ?

      AND fr.status = 'PUBLISHED'

    LIMIT 1
    `,
    [
      Number(resultId),
      Number(userId)
    ]
  );

  if (!rows.length) {
    const error = new Error(
      "Result not found."
    );

    error.statusCode = 404;
    error.code = "RESULT_NOT_FOUND";

    throw error;
  }

  const row = rows[0];
  const student = await getStudentContext(userId);
  const attempts = await getAttemptHistory(userId, row.moduleId);
  const assessmentRows = await AppDataSource.query(`
    SELECT ig.ica_grade_id AS assessmentId, e.enrollment_id AS enrollmentId,
      ica.ica_number AS icaNumber, ica.title, ig.grade
    FROM ICA_GRADES ig
    INNER JOIN ENROLLMENTS e ON e.enrollment_id = ig.enrollment_id
    INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
    INNER JOIN MODULE_ICAS ica ON ica.ica_id = ig.ica_id AND ica.offering_id = mo.offering_id
    WHERE e.student_id = ? AND mo.module_id = ?
      AND EXISTS (SELECT 1 FROM FINAL_RESULTS fr
        WHERE fr.enrollment_id = e.enrollment_id AND fr.status = 'PUBLISHED')
    ORDER BY ica.ica_number, ig.ica_grade_id
  `, [userId, row.moduleId]);
  const assessmentsFor = (enrollmentId) => assessmentRows
    .filter((assessment) => Number(assessment.enrollmentId) === Number(enrollmentId))
    .map((assessment) => ({
      assessmentId: Number(assessment.assessmentId),
      icaNumber: Number(assessment.icaNumber),
      title: assessment.title || `ICA ${assessment.icaNumber}`,
      grade: assessment.grade
    }));

  return {
    resultId: Number(row.resultId),

    module: {
      id: Number(row.moduleId),
      code: row.moduleCode,
      title: row.moduleTitle,
      credits: Number(row.credits)
    },

    semester: {
      id: Number(row.semesterId),
      ...getStudyPeriod(student, row.academicYear, row.semesterName)
    },

    attemptNumber:
      Number(row.attemptNumber),

    finalGrade:
      row.finalGrade,

    gradePoint:
      row.gradePoint === null
        ? null
        : Number(row.gradePoint),

    outcomeCode: null,

    creditsEarned: null,

    countsTowardGpa: null,

    assessments: assessmentsFor(row.enrollmentId),

    attemptHistory: attempts.map((attempt) => ({
      ...attempt,
      assessments: assessmentsFor(attempt.enrollmentId),
      enrollmentId: Number(attempt.enrollmentId),
      attemptNumber: Number(attempt.attemptNumber),
      resultId: attempt.resultId == null ? null : Number(attempt.resultId),
      gradePoint: attempt.gradePoint == null ? null : Number(attempt.gradePoint),
      isCurrent: Boolean(Number(attempt.isCurrent)),
      isResit: attempt.isResit == null ? null : Boolean(Number(attempt.isResit)),
      semester: {
        id: Number(attempt.semesterId),
        academicYear: attempt.academicYear,
        ...getStudyPeriod(student, attempt.academicYear, attempt.semesterName)
      }
    }))
  };
}
