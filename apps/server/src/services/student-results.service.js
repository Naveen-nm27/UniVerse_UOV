import { AppDataSource } from "../data-source.js";

export async function getPublishedResults(
  userId,
  semesterId = null
) {

  let sql = `
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
      sem.start_date AS semesterStartDate,
      fr.published_at AS publishedAt,

      fr.final_grade AS finalGrade,

      gs.grade_point AS gradePoint

    FROM FINAL_RESULTS fr

    INNER JOIN ENROLLMENTS e
      ON e.enrollment_id = fr.enrollment_id

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id

    INNER JOIN MODULES m
      ON m.module_id = mo.module_id

    INNER JOIN SEMESTERS sem
      ON sem.semester_id = mo.semester_id

    LEFT JOIN GRADE_SCALE gs
      ON gs.grade = fr.final_grade

    WHERE e.student_id = ?

      AND fr.status = 'PUBLISHED'
  `;

  const params = [userId];

  if (semesterId) {
    sql += `
      AND sem.semester_id = ?
    `;

    params.push(Number(semesterId));
  }

  sql += `
    ORDER BY
      sem.start_date DESC,
      m.module_code ASC, e.attempt_number DESC, fr.result_id DESC
  `;

  return AppDataSource.query(
    sql,
    params
  );
}
