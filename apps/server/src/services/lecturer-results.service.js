import { AppDataSource } from "../data-source.js";

export async function getOfferingResults(userId, offeringId) {
  const rows = await AppDataSource.query(
    `
      SELECT fr.result_id AS resultId,
             fr.final_grade AS finalGrade,
             fr.status,
             fr.published_at AS publishedAt,
             u.name AS studentName,
             s.registration_number AS registrationNumber,
             m.module_code AS moduleCode
      FROM FINAL_RESULTS fr
      JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
      JOIN STUDENTS s ON s.user_id = e.student_id
      JOIN USERS u ON u.user_id = s.user_id
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      WHERE mo.lecturer_id = ? AND e.offering_id = ?
      ORDER BY fr.result_id DESC
    `,
    [userId, offeringId]
  );

  return rows.map((row) => ({
    resultId: Number(row.resultId),
    offeringId: Number(offeringId),
    offeringCode: row.moduleCode,
    studentName: row.studentName,
    registrationNumber: row.registrationNumber,
    finalGrade: row.finalGrade,
    gradePoint: null,
    status: row.status,
    publishedAt: row.publishedAt,
  }));
}

export async function getLecturerResultDetail(userId, resultId) {
  const [row] = await AppDataSource.query(
    `
      SELECT fr.result_id AS resultId,
             fr.final_grade AS finalGrade,
             fr.status,
             fr.published_at AS publishedAt,
             u.name AS studentName,
             s.registration_number AS registrationNumber,
             m.module_code AS moduleCode
      FROM FINAL_RESULTS fr
      JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
      JOIN STUDENTS s ON s.user_id = e.student_id
      JOIN USERS u ON u.user_id = s.user_id
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      WHERE mo.lecturer_id = ? AND fr.result_id = ?
    `,
    [userId, resultId]
  );

  if (!row) {
    const error = new Error("Resource not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  return {
    id: Number(row.resultId),
    studentName: row.studentName,
    registrationNumber: row.registrationNumber,
    examType: "Final exam",
    examDate: null,
    examGrade: row.finalGrade,
    finalGrade: row.finalGrade,
    status: row.status,
    publishedAt: row.publishedAt,
  };
}

export async function getResultHistory(userId, resultId) {
  const rows = await AppDataSource.query(
    `
      SELECT rsh.history_id AS id,
             rsh.to_status AS action,
             u.name AS by,
             rsh.changed_at AS at
      FROM RESULT_STATUS_HISTORY rsh
      LEFT JOIN USERS u ON u.user_id = rsh.updated_by
      JOIN FINAL_RESULTS fr ON fr.result_id = rsh.result_id
      JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
      WHERE mo.lecturer_id = ? AND rsh.result_id = ?
      ORDER BY rsh.changed_at DESC
    `,
    [userId, resultId]
  );

  return rows.map((row) => ({
    id: Number(row.id),
    action: row.action,
    by: row.by || "Academic office",
    at: row.at,
  }));
}
