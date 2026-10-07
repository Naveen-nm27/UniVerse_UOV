import { AppDataSource } from "../data-source.js";

export async function getSessionAttendance(userId, sessionId) {
  const rows = await AppDataSource.query(
    `
      SELECT a.attendance_id AS attendanceId,
             a.student_id AS studentId,
             u.name AS name,
             s.registration_number AS registrationNumber,
             a.scanned_at AS scannedAt,
             a.status,
             a.recorded_via AS recordedVia
      FROM ATTENDANCE a
      JOIN LECTURE_SESSIONS ls ON ls.session_id = a.session_id
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
      JOIN STUDENTS s ON s.user_id = a.student_id
      JOIN USERS u ON u.user_id = s.user_id
      WHERE mo.lecturer_id = ? AND ls.session_id = ?
      ORDER BY a.scanned_at DESC
    `,
    [userId, sessionId]
  );

  return rows.map((row) => ({
    id: Number(row.attendanceId),
    studentId: Number(row.studentId),
    name: row.name,
    registrationNumber: row.registrationNumber,
    status: row.status,
    scanTime: row.scannedAt,
    recordedVia: row.recordedVia,
  }));
}
