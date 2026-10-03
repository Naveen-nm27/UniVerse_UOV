import { AppDataSource } from "../data-source.js";

export async function getAttemptHistory(
  userId,
  moduleId
) {

  return AppDataSource.query(
    `
    SELECT

      e.attempt_number AS attemptNumber,
      e.enrollment_id AS enrollmentId,
      e.status AS enrollmentStatus,
      e.is_current AS isCurrent,
      e.enrolled_at AS enrolledAt,
      fr.result_id AS resultId,
      fr.exam_grade AS examGrade,
      gs.grade_point AS gradePoint,
      ex.exam_type AS examType,
      ex.is_resit AS isResit,
      ex.exam_date AS examDate,

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

    LEFT JOIN EXAMS ex ON ex.exam_id = fr.exam_id
    LEFT JOIN GRADE_SCALE gs ON gs.grade = fr.final_grade

    WHERE e.student_id = ?

      AND mo.module_id = ?

    ORDER BY
      e.attempt_number ASC, e.enrollment_id ASC, fr.result_id ASC
    `,
    [
      userId,
      moduleId
    ]
  );
}
