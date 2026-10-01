import { AppDataSource } from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";
import { getStudyPeriod } from "./student-academic-period.service.js";

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

    assessments: [],

    attemptHistory: []
  };
}
