import { AppDataSource } from "../data-source.js";

export async function getStudentAssessments(
  userId,
  semesterId = null
) {

  let sql = `
    SELECT DISTINCT

      ig.ica_grade_id AS assessmentId,

      ica.ica_number AS icaNumber,
      ica.title AS title,

      ig.grade AS grade,

      m.module_id AS moduleId,
      m.module_code AS moduleCode,
      m.module_name AS moduleTitle,

      sem.semester_id AS semesterId,
      sem.semester_name AS semesterName,
      sem.academic_year AS academicYear,
      sem.start_date AS semesterStartDate

    FROM ICA_GRADES ig

    INNER JOIN MODULE_ICAS ica
      ON ica.ica_id = ig.ica_id

    INNER JOIN ENROLLMENTS e
      ON e.enrollment_id = ig.enrollment_id

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id AND ica.offering_id = mo.offering_id

    INNER JOIN MODULES m
      ON m.module_id = mo.module_id

    INNER JOIN SEMESTERS sem
      ON sem.semester_id = mo.semester_id

    INNER JOIN FINAL_RESULTS fr
      ON fr.enrollment_id = e.enrollment_id

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
      semesterStartDate DESC,
      m.module_code,
      ica.ica_number
  `;

  return AppDataSource.query(
    sql,
    params
  );
}
