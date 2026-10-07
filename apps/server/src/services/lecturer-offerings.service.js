import { AppDataSource } from "../data-source.js";

export async function getLecturerOfferings(userId, semesterId = null) {
  const rows = await AppDataSource.query(
    `
      SELECT mo.offering_id AS offeringId,
             mo.module_id AS moduleId,
             mo.semester_id AS semesterId,
             m.module_code AS moduleCode,
             m.module_name AS title,
             h.hall_name AS hall,
             COUNT(DISTINCT e.student_id) AS studentCount,
             ROUND(AVG(CASE WHEN a.status = 'present' THEN 100 ELSE 0 END), 0) AS attendanceRate
      FROM MODULE_OFFERINGS mo
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      LEFT JOIN HALLS h ON h.hall_id = mo.hall_id
      LEFT JOIN ENROLLMENTS e ON e.offering_id = mo.offering_id
      LEFT JOIN LECTURE_SESSIONS ls ON ls.offering_id = mo.offering_id
      LEFT JOIN ATTENDANCE a ON a.session_id = ls.session_id
      WHERE mo.lecturer_id = ?
        ${semesterId ? "AND mo.semester_id = ?" : ""}
      GROUP BY mo.offering_id, mo.module_id, mo.semester_id, m.module_code, m.module_name, h.hall_name
      ORDER BY mo.offering_id DESC
    `,
    semesterId ? [userId, semesterId] : [userId]
  );

  return rows.map((row) => ({
    id: Number(row.offeringId),
    moduleId: Number(row.moduleId),
    moduleCode: row.moduleCode,
    title: row.title,
    semesterId: Number(row.semesterId),
    hall: row.hall,
    studentCount: Number(row.studentCount || 0),
    attendanceRate: Number(row.attendanceRate || 0),
  }));
}

export async function getLecturerOfferingDetail(userId, offeringId) {
  const [row] = await AppDataSource.query(
    `
      SELECT mo.offering_id AS offeringId,
             mo.module_id AS moduleId,
             mo.semester_id AS semesterId,
             m.module_code AS moduleCode,
             m.module_name AS title,
             h.hall_name AS hall,
             COUNT(DISTINCT e.student_id) AS studentCount
      FROM MODULE_OFFERINGS mo
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      LEFT JOIN HALLS h ON h.hall_id = mo.hall_id
      LEFT JOIN ENROLLMENTS e ON e.offering_id = mo.offering_id
      WHERE mo.lecturer_id = ? AND mo.offering_id = ?
      GROUP BY mo.offering_id, mo.module_id, mo.semester_id, m.module_code, m.module_name, h.hall_name
    `,
    [userId, offeringId]
  );

  if (!row) {
    const error = new Error("Resource not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  const roster = await AppDataSource.query(
    `
      SELECT s.user_id AS id,
             u.name AS name,
             s.registration_number AS registrationNumber,
             COUNT(DISTINCT a.attendance_id) AS attendanceCount
      FROM ENROLLMENTS en
      JOIN STUDENTS s ON s.user_id = en.student_id
      JOIN USERS u ON u.user_id = s.user_id
      LEFT JOIN LECTURE_SESSIONS ls ON ls.offering_id = en.offering_id
      LEFT JOIN ATTENDANCE a ON a.session_id = ls.session_id AND a.student_id = s.user_id
      WHERE en.offering_id = ?
      GROUP BY s.user_id, u.name, s.registration_number
      ORDER BY u.name
    `,
    [offeringId]
  );

  return {
    id: Number(row.offeringId),
    moduleCode: row.moduleCode,
    title: row.title,
    semesterId: Number(row.semesterId),
    hall: row.hall,
    studentCount: Number(row.studentCount || 0),
    roster: roster.map((student) => ({
      id: Number(student.id),
      name: student.name,
      registrationNumber: student.registrationNumber,
      attendance: Number(student.attendanceCount || 0),
      status: "Active",
    })),
    summary: {
      attendanceRate: 0,
      pendingResults: 0,
    },
  };
}
