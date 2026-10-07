import { AppDataSource } from "../data-source.js";

export async function getLecturerSessions(userId, semesterId = null) {
  const rows = await AppDataSource.query(
    `
      SELECT ls.session_id AS sessionId,
             ls.session_date AS sessionDate,
             ls.opened_at AS openedAt,
             ls.closed_at AS closedAt,
             ls.hall_id AS hallId,
             mo.offering_id AS offeringId,
             m.module_code AS moduleCode,
             m.module_name AS title,
             h.hall_name AS location,
             COUNT(a.attendance_id) AS attendanceCount,
             COUNT(DISTINCT e.student_id) AS enrolledCount
      FROM LECTURE_SESSIONS ls
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      LEFT JOIN HALLS h ON h.hall_id = ls.hall_id
      LEFT JOIN ENROLLMENTS e ON e.offering_id = mo.offering_id
      LEFT JOIN ATTENDANCE a ON a.session_id = ls.session_id
      WHERE mo.lecturer_id = ?
        ${semesterId ? "AND mo.semester_id = ?" : ""}
      GROUP BY ls.session_id, ls.session_date, ls.opened_at, ls.closed_at, ls.hall_id, mo.offering_id, m.module_code, m.module_name, h.hall_name
      ORDER BY ls.session_date DESC, ls.opened_at DESC
    `,
    semesterId ? [userId, semesterId] : [userId]
  );

  return rows.map((row) => ({
    id: Number(row.sessionId),
    title: row.title || "Lecture Session",
    offeringId: Number(row.offeringId),
    offeringCode: row.moduleCode,
    date: row.sessionDate,
    startTime: row.openedAt ? new Date(row.openedAt).toTimeString().slice(0, 5) : "00:00",
    endTime: row.closedAt ? new Date(row.closedAt).toTimeString().slice(0, 5) : "00:00",
    status: row.closedAt ? "Completed" : "Scheduled",
    attendanceCount: Number(row.attendanceCount || 0),
    enrolledCount: Number(row.enrolledCount || 0),
    location: row.location,
  }));
}

export async function getLecturerSessionById(userId, sessionId) {
  const [row] = await AppDataSource.query(
    `
      SELECT ls.session_id AS sessionId,
             ls.session_date AS sessionDate,
             ls.opened_at AS openedAt,
             ls.closed_at AS closedAt,
             ls.hall_id AS hallId,
             mo.offering_id AS offeringId,
             m.module_code AS moduleCode,
             m.module_name AS title,
             h.hall_name AS location
      FROM LECTURE_SESSIONS ls
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      LEFT JOIN HALLS h ON h.hall_id = ls.hall_id
      WHERE mo.lecturer_id = ? AND ls.session_id = ?
    `,
    [userId, sessionId]
  );

  if (!row) {
    const error = new Error("Resource not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  return {
    id: Number(row.sessionId),
    title: row.title || "Lecture Session",
    offeringId: Number(row.offeringId),
    offeringCode: row.moduleCode,
    date: row.sessionDate,
    startTime: row.openedAt ? new Date(row.openedAt).toTimeString().slice(0, 5) : "00:00",
    endTime: row.closedAt ? new Date(row.closedAt).toTimeString().slice(0, 5) : "00:00",
    location: row.location,
    status: row.closedAt ? "Completed" : "Scheduled",
  };
}

export async function openLectureSessionForOffering(userId, payload = {}) {
  const offeringId = Number(payload.offeringId);
  if (!offeringId) {
    const error = new Error("offeringId is required");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const [match] = await AppDataSource.query(
    `SELECT offering_id AS offeringId FROM MODULE_OFFERINGS WHERE lecturer_id = ? AND offering_id = ?`,
    [userId, offeringId]
  );

  if (!match) {
    const error = new Error("Resource not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  const [result] = await AppDataSource.query(
    `INSERT INTO LECTURE_SESSIONS (offering_id, hall_id, session_date, opened_at, opened_by)
     VALUES (?, ?, ?, NOW(), ?)
    `,
    [offeringId, payload.hallId || null, payload.sessionDate || new Date().toISOString().slice(0, 10), userId]
  );

  return { id: result.insertId };
}

export async function closeLectureSessionById(userId, sessionId) {
  const [match] = await AppDataSource.query(
    `SELECT ls.session_id AS sessionId
     FROM LECTURE_SESSIONS ls
     JOIN MODULE_OFFERINGS mo ON mo.offering_id = ls.offering_id
     WHERE mo.lecturer_id = ? AND ls.session_id = ?`,
    [userId, sessionId]
  );

  if (!match) {
    const error = new Error("Resource not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  await AppDataSource.query(
    `UPDATE LECTURE_SESSIONS SET closed_at = NOW() WHERE session_id = ?`,
    [sessionId]
  );

  return { ok: true };
}
