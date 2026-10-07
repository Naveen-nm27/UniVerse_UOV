import { AppDataSource } from "../data-source.js";

export async function getLecturerDashboard(userId, semesterId = null) {
  const offerings = await AppDataSource.query(
    `
      SELECT mo.offering_id AS offeringId,
             COUNT(DISTINCT e.student_id) AS studentCount
      FROM MODULE_OFFERINGS mo
      LEFT JOIN ENROLLMENTS e ON e.offering_id = mo.offering_id
      WHERE mo.lecturer_id = ?
        ${semesterId ? "AND mo.semester_id = ?" : ""}
      GROUP BY mo.offering_id
    `,
    semesterId ? [userId, semesterId] : [userId]
  );

  const activeOfferings = offerings.length;
  const enrolledStudents = offerings.reduce((sum, row) => sum + Number(row.studentCount || 0), 0);

  const [sessionSummary] = await AppDataSource.query(
    `
      SELECT COUNT(*) AS sessionsThisWeek
      FROM LECTURE_SESSIONS ls
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
      WHERE mo.lecturer_id = ?
        AND ls.session_date BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE()
    `,
    [userId]
  );

  const [attendanceRow] = await AppDataSource.query(
    `
      SELECT ROUND(AVG(CASE WHEN a.status = 'present' THEN 100 ELSE 0 END), 0) AS attendanceRate
      FROM ATTENDANCE a
      JOIN LECTURE_SESSIONS ls ON ls.session_id = a.session_id
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
      WHERE mo.lecturer_id = ?
    `,
    [userId]
  );

  return {
    summary: {
      activeOfferings,
      enrolledStudents,
      sessionsThisWeek: Number(sessionSummary?.sessionsThisWeek || 0),
      attendanceRate: Number(attendanceRow?.attendanceRate || 0),
    },
  };
}
