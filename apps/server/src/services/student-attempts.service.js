import { AppDataSource } from "../data-source.js";

export async function getAttemptHistory(
  userId,
  moduleId
) {

  return AppDataSource.query(
    `
    SELECT

      e.attempt_number AS attemptNumber,

      sem.semester_id AS semesterId,
      sem.semester_name AS semesterName,
      sem.academic_year AS academicYear,

      fr.final_grade AS finalGrade,

      fr.published_at AS publishedAt

    FROM ENROLLMENTS e

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id

    INNER JOIN SEMESTERS sem
      ON sem.semester_id = mo.semester_id

    LEFT JOIN FINAL_RESULTS fr
      ON fr.enrollment_id = e.enrollment_id
      AND fr.status = 'PUBLISHED'

    WHERE e.student_id = ?

      AND mo.module_id = ?

    ORDER BY
      e.attempt_number ASC
    `,
    [
      userId,
      moduleId
    ]
  );
}