import { AppDataSource as db } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
import { campusDate, campusTimestamp } from "../utils/campus-time.js";
import { getLecturerCapabilities } from "./permissions.service.js";

const notFound = () => new ApiError(404, "RESOURCE_NOT_FOUND", "Resource not found.");
const offeringJoin = `FROM MODULE_OFFERINGS mo JOIN MODULES m ON m.module_id=mo.module_id
 JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id JOIN HALLS h ON h.hall_id=mo.hall_id
 JOIN PROGRAMME_SEMESTERS ps ON ps.programme_semester_id=m.programme_semester_id`;
function scope(userId, q = {}) {
  const args = [userId];
  let where = "mo.lecturer_id=?";
  if (q.semesterId) {
    where += " AND mo.semester_id=?";
    args.push(q.semesterId);
  }
  if (q.offeringId) {
    where += " AND mo.offering_id=?";
    args.push(q.offeringId);
  }
  return { where, args };
}
async function collection(select, from, where, args, q = {}, order = "1") {
  const page = q.page || 1,
    pageSize = q.pageSize || 25;
  const [[count], data] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, args),
    db.query(`SELECT ${select} ${from} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`, [
      ...args,
      pageSize,
      (page - 1) * pageSize,
    ]),
  ]);
  return {
    data,
    meta: {
      page,
      pageSize,
      total: Number(count.total),
      totalPages: Math.ceil(Number(count.total) / pageSize),
    },
  };
}
export async function profile(userId) {
  const [row] = await db.query(
    `SELECT u.user_id AS id,u.name AS fullName,u.email,u.phone,l.staff_number AS staffNumber,
    l.date_joined AS dateJoined,d.department_name AS department,d.department_code AS departmentCode
    FROM LECTURERS l JOIN USERS u ON u.user_id=l.user_id JOIN DEPARTMENTS d ON d.department_id=l.department_id WHERE l.user_id=?`,
    [userId],
  );
  if (!row) throw new ApiError(403, "LECTURER_PROFILE_REQUIRED", "A lecturer profile is required.");
  return { ...row, capabilities: getLecturerCapabilities() };
}
export async function semesters(userId) {
  return db.query(
    `SELECT DISTINCT sem.semester_id AS id,CONCAT(sem.academic_year,' · ',sem.semester_name) AS label,
    sem.start_date AS startDate,sem.end_date AS endDate FROM SEMESTERS sem JOIN MODULE_OFFERINGS mo ON mo.semester_id=sem.semester_id
    WHERE mo.lecturer_id=? ORDER BY sem.start_date DESC,sem.semester_id DESC`,
    [userId],
  );
}
export async function ownedOffering(userId, id) {
  const [row] = await db.query(
    `SELECT mo.offering_id AS id,mo.module_id AS moduleId,m.module_code AS moduleCode,m.module_name AS title,
    mo.semester_id AS semesterId,CONCAT(sem.academic_year,' · ',sem.semester_name) AS semesterLabel,
    ps.name AS studyYear,h.hall_name AS hall,
    (SELECT COUNT(DISTINCT e.student_id) FROM ENROLLMENTS e WHERE e.offering_id=mo.offering_id AND e.is_current=1 AND e.status='registered') AS studentCount
    ${offeringJoin} WHERE mo.lecturer_id=? AND mo.offering_id=?`,
    [userId, id],
  );
  if (!row) throw notFound();
  return row;
}
export async function offerings(userId, q = {}) {
  const { where, args } = scope(userId, q);
  return collection(
    `mo.offering_id AS id,mo.module_id AS moduleId,m.module_code AS moduleCode,m.module_name AS title,
    mo.semester_id AS semesterId,CONCAT(sem.academic_year,' · ',sem.semester_name) AS semesterLabel,ps.name AS studyYear,h.hall_name AS hall,
    (SELECT COUNT(DISTINCT e.student_id) FROM ENROLLMENTS e WHERE e.offering_id=mo.offering_id AND e.is_current=1 AND e.status='registered') AS studentCount,
    NULL AS attendanceRate`,
    offeringJoin,
    where,
    args,
    q,
    "mo.offering_id DESC",
  );
}
export async function students(userId, offeringId, q = {}) {
  await ownedOffering(userId, offeringId);
  let where = "mo.lecturer_id=? AND e.offering_id=?";
  const args = [userId, offeringId];
  if (q.search) {
    where += " AND (u.name LIKE ? OR s.registration_number LIKE ?)";
    args.push(`%${q.search}%`, `%${q.search}%`);
  }
  return collection(
    `e.enrollment_id AS enrollmentId,s.user_id AS id,u.name AS name,s.registration_number AS registrationNumber,
    b.batch_name AS batch,e.attempt_number AS attemptNumber,e.status AS enrollmentStatus,e.is_current AS isCurrent`,
    `FROM ENROLLMENTS e JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id JOIN STUDENTS s ON s.user_id=e.student_id
    JOIN USERS u ON u.user_id=s.user_id JOIN BATCHES b ON b.batch_id=s.batch_id`,
    where,
    args,
    q,
    "s.registration_number,e.enrollment_id",
  );
}
export async function offering(userId, id) {
  const item = await ownedOffering(userId, id);
  return {
    ...item,
    roster: (await students(userId, id, { pageSize: 100 })).data,
    summary: { attendanceRate: null },
  };
}
export async function timetable(userId, q = {}) {
  const { where, args } = scope(userId, q);
  const from = q.from || campusDate(),
    to = q.to || new Date(Date.parse(from) + 7 * 86400000).toISOString().slice(0, 10);
  const rows = await db.query(
    `SELECT ts.slot_id AS id,ts.offering_id AS offeringId,m.module_code AS moduleCode,m.module_name AS title,
    ts.day_of_week AS dayOfWeek,ts.start_time AS startTime,ts.end_time AS endTime,ts.effective_from AS effectiveFrom,
    ts.effective_until AS effectiveUntil,h.hall_name AS room FROM TIMETABLE_SLOTS ts
    JOIN MODULE_OFFERINGS mo ON mo.offering_id=ts.offering_id JOIN MODULES m ON m.module_id=mo.module_id
    JOIN HALLS h ON h.hall_id=ts.hall_id WHERE ${where} AND ts.is_active=1
    AND ts.effective_from<=? AND (ts.effective_until IS NULL OR ts.effective_until>=?) ORDER BY ts.day_of_week,ts.start_time,ts.slot_id`,
    [...args, to, from],
  );
  return rows
    .filter((r) => {
      const start = Date.parse(r.effectiveFrom > from ? r.effectiveFrom : from),
        end = Date.parse(r.effectiveUntil && r.effectiveUntil < to ? r.effectiveUntil : to);
      const weekday = ((new Date(start).getUTCDay() + 6) % 7) + 1;
      return start + ((Number(r.dayOfWeek) - weekday + 7) % 7) * 86400000 <= end;
    })
    .map((r) => ({
      ...r,
      day: [null, "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][r.dayOfWeek],
      time: `${r.startTime} - ${r.endTime}`,
    }));
}
const sessionFrom = `FROM LECTURE_SESSIONS ls JOIN MODULE_OFFERINGS mo ON mo.offering_id=ls.offering_id
  JOIN MODULES m ON m.module_id=mo.module_id JOIN HALLS h ON h.hall_id=ls.hall_id`;
const sessionSelect = `ls.session_id AS id,ls.offering_id AS offeringId,m.module_code AS offeringCode,m.module_name AS title,
  ls.session_date AS date,ls.opened_at AS openedAt,ls.closed_at AS closedAt,h.hall_name AS location,
  (SELECT COUNT(*) FROM ATTENDANCE a WHERE a.session_id=ls.session_id) AS attendanceCount,
  (SELECT COUNT(DISTINCT e.student_id) FROM ENROLLMENTS e WHERE e.offering_id=mo.offering_id AND e.is_current=1 AND e.status='registered') AS enrolledCount`;
function mapSession(row) {
  return {
    ...row,
    openedAt: campusTimestamp(row.openedAt),
    closedAt: campusTimestamp(row.closedAt),
    startTime: String(row.openedAt).slice(11, 16),
    endTime: row.closedAt ? String(row.closedAt).slice(11, 16) : null,
    status: row.closedAt ? "Closed" : "Open",
  };
}
export async function sessions(userId, q = {}) {
  const { where, args } = scope(userId, q);
  const response = await collection(
    sessionSelect,
    sessionFrom,
    where,
    args,
    q,
    "ls.session_date DESC,ls.session_id DESC",
  );
  response.data = response.data.map(mapSession);
  return response;
}
export async function session(userId, id) {
  const [row] = await db.query(
    `SELECT ${sessionSelect} ${sessionFrom} WHERE mo.lecturer_id=? AND ls.session_id=?`,
    [userId, id],
  );
  if (!row) throw notFound();
  return mapSession(row);
}
export async function attendance(userId, id, q = {}) {
  const item = await session(userId, id);
  const duplicate = await db.query(
    `SELECT student_id FROM ENROLLMENTS WHERE offering_id=? AND is_current=1 AND status='registered'
    GROUP BY student_id HAVING COUNT(*)>1`,
    [item.offeringId],
  );
  if (duplicate.length)
    throw new ApiError(
      409,
      "ROSTER_DATA_CONFLICT",
      "The current enrollment roster contains duplicate attempts.",
    );
  const rows = await db.query(
    `SELECT s.user_id AS studentId,u.name,s.registration_number AS registrationNumber,e.enrollment_id AS enrollmentId,
    e.attempt_number AS attemptNumber,a.attendance_id AS id,COALESCE(a.status,'notRecorded') AS status,a.scanned_at AS scanTime,a.recorded_via AS recordedVia
    FROM STUDENTS s JOIN USERS u ON u.user_id=s.user_id
    LEFT JOIN ENROLLMENTS e ON e.student_id=s.user_id AND e.offering_id=? AND e.is_current=1 AND e.status='registered'
    LEFT JOIN ATTENDANCE a ON a.student_id=s.user_id AND a.session_id=?
    WHERE e.enrollment_id IS NOT NULL OR a.attendance_id IS NOT NULL ORDER BY s.registration_number,s.user_id`,
    [item.offeringId, id],
  );
  const summary = { rosterCount: rows.length, present: 0, late: 0, absent: 0, notRecorded: 0 };
  rows.forEach((r) => {
    if (r.status in summary) summary[r.status]++;
  });
  const filtered = q.search
    ? rows.filter((r) =>
        `${r.name} ${r.registrationNumber}`.toLowerCase().includes(q.search.toLowerCase()),
      )
    : rows;
  const page = q.page || 1,
    pageSize = q.pageSize || 25;
  return {
    data: filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map((r) => ({ ...r, scanTime: campusTimestamp(r.scanTime) })),
    meta: { page, pageSize, total: filtered.length, rosterBasis: "currentEnrollment", summary },
  };
}
const resultFrom = `FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id
 JOIN EXAMS ex ON ex.exam_id=fr.exam_id AND ex.offering_id=e.offering_id
 JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id JOIN MODULES m ON m.module_id=mo.module_id
 JOIN STUDENTS s ON s.user_id=e.student_id JOIN USERS u ON u.user_id=s.user_id`;
const resultSelect = `fr.result_id AS resultId,mo.offering_id AS offeringId,m.module_code AS offeringCode,u.name AS studentName,
 s.registration_number AS registrationNumber,e.attempt_number AS attemptNumber,ex.exam_type AS examType,ex.exam_date AS examDate,
 CASE WHEN fr.status='PUBLISHED' THEN fr.exam_grade ELSE NULL END AS examGrade,
 CASE WHEN fr.status='PUBLISHED' THEN fr.final_grade ELSE NULL END AS finalGrade,fr.status,fr.published_at AS publishedAt`;
export async function results(userId, q = {}) {
  if (q.offeringId) await ownedOffering(userId, q.offeringId);
  let { where, args } = scope(userId, q);
  if (q.status) {
    where += " AND fr.status=?";
    args.push(q.status);
  }
  if (q.search) {
    where += " AND (u.name LIKE ? OR s.registration_number LIKE ?)";
    args.push(`%${q.search}%`, `%${q.search}%`);
  }
  const response = await collection(resultSelect, resultFrom, where, args, q, "fr.result_id DESC");
  response.data = response.data.map((r) => ({ ...r, publishedAt: campusTimestamp(r.publishedAt) }));
  return response;
}
export async function result(userId, id) {
  const [row] = await db.query(
    `SELECT ${resultSelect} ${resultFrom} WHERE mo.lecturer_id=? AND fr.result_id=?`,
    [userId, id],
  );
  if (!row) throw notFound();
  return { ...row, id: row.resultId, publishedAt: campusTimestamp(row.publishedAt) };
}
export async function history(userId, id) {
  await result(userId, id);
  const rows = await db.query(
    `SELECT CAST(rsh.history_id AS CHAR) AS id,rsh.from_status AS fromStatus,rsh.to_status AS action,rsh.note,
    u.name AS \`by\`,rsh.changed_at AS at FROM RESULT_STATUS_HISTORY rsh JOIN USERS u ON u.user_id=rsh.updated_by
    JOIN FINAL_RESULTS fr ON fr.result_id=rsh.result_id JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id
    JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id WHERE mo.lecturer_id=? AND fr.result_id=?
    ORDER BY rsh.changed_at,rsh.history_id`,
    [userId, id],
  );
  return rows.map((r) => ({ ...r, at: campusTimestamp(r.at) }));
}
export async function assessments(userId, q = {}) {
  if (q.offeringId) await ownedOffering(userId, q.offeringId);
  const { where, args } = scope(userId, q);
  return collection(
    `mi.ica_id AS assessmentId,e.enrollment_id AS enrollmentId,mo.offering_id AS offeringId,m.module_code AS offeringCode,
    u.name AS studentName,s.registration_number AS registrationNumber,COALESCE(mi.title,CONCAT('ICA ',mi.ica_number)) AS title,mi.ica_number AS icaNumber,'ICA' AS type,
    CASE WHEN EXISTS (SELECT 1 FROM FINAL_RESULTS fr JOIN EXAMS ex ON ex.exam_id=fr.exam_id AND ex.offering_id=e.offering_id
      WHERE fr.enrollment_id=e.enrollment_id AND fr.status='PUBLISHED') THEN ig.grade ELSE NULL END AS grade,ig.entered_at AS enteredAt`,
    `FROM MODULE_ICAS mi JOIN MODULE_OFFERINGS mo ON mo.offering_id=mi.offering_id JOIN MODULES m ON m.module_id=mo.module_id
    LEFT JOIN ENROLLMENTS e ON e.offering_id=mo.offering_id LEFT JOIN STUDENTS s ON s.user_id=e.student_id LEFT JOIN USERS u ON u.user_id=s.user_id
    LEFT JOIN ICA_GRADES ig ON ig.ica_id=mi.ica_id AND ig.enrollment_id=e.enrollment_id`,
    where,
    args,
    q,
    "mo.offering_id,mi.ica_number,e.enrollment_id",
  );
}
export async function dashboard(userId, q = {}) {
  const { where, args } = scope(userId, q),
    today = campusDate();
  const [counts] = await db.query(
    `SELECT COUNT(*) AS activeOfferings,
    (SELECT COUNT(DISTINCT e.student_id) FROM ENROLLMENTS e JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
      WHERE ${where} AND e.is_current=1 AND e.status='registered') AS enrolledStudents,
    (SELECT COUNT(*) FROM LECTURE_SESSIONS ls JOIN MODULE_OFFERINGS mo ON mo.offering_id=ls.offering_id WHERE ${where}
      AND ls.session_date BETWEEN DATE_SUB(?,INTERVAL 6 DAY) AND ?) AS sessionsThisWeek
    FROM MODULE_OFFERINGS mo WHERE ${where}`,
    [...args, ...args, today, today, ...args],
  );
  return { summary: { ...counts, attendanceRate: null }, today, timezone: "Asia/Colombo" };
}
