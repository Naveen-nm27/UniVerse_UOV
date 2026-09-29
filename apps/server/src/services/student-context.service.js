import { AppDataSource } from "../data-source.js";

export async function getStudentContext(userId) {

  const rows = await AppDataSource.query(
    `
    SELECT
      u.user_id AS userId,
      u.name AS fullName,
      u.email AS email,

      s.registration_number AS registrationNumber,
      s.batch_id AS batchId,
      s.current_semester AS currentSemester,

      b.batch_name AS batchName,

      sp.programme_id AS programmeId,
      p.programme_code AS programmeCode,
      p.programme_name AS programmeName

    FROM USERS u

    INNER JOIN STUDENTS s
      ON s.user_id = u.user_id

    LEFT JOIN BATCHES b
      ON b.batch_id = s.batch_id

    LEFT JOIN STUDENT_PROGRAMMES sp
      ON sp.student_id = s.user_id
      AND sp.status = 'active'

    LEFT JOIN PROGRAMMES p
      ON p.programme_id = sp.programme_id

    WHERE u.user_id = ?
      AND u.role_code = 'STUDENT'
      AND u.is_active = 1

    LIMIT 1
    `,
    [userId]
  );

  if (!rows.length) {
    const error = new Error(
      "Student profile not found."
    );

    error.statusCode = 404;
    error.code = "STUDENT_NOT_FOUND";

    throw error;
  }

  return rows[0];
}