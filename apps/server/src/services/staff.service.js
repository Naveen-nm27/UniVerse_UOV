import { AppDataSource as db } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
import { campusTimestamp } from "../utils/campus-time.js";

export async function staffScope(userId, role) {
  if (["MA", "ADMIN"].includes(role)) return { departmentId: null, departmentName: null };
  const sql =
    role === "HOD"
      ? `SELECT d.department_id AS departmentId,d.department_name AS departmentName FROM DEPARTMENTS d
    JOIN LECTURERS l ON l.user_id=d.head_lecturer_id AND l.department_id=d.department_id AND l.is_hod=1 WHERE l.user_id=?`
      : `SELECT d.department_id AS departmentId,d.department_name AS departmentName FROM DEANS dean
    JOIN DEPARTMENTS d ON d.department_id=dean.department_id WHERE dean.user_id=?`;
  const [scope] = await db.query(sql, [userId]);
  if (!scope)
    throw new ApiError(
      403,
      "STAFF_PROFILE_REQUIRED",
      "An assigned department profile is required.",
    );
  return scope;
}

const resultFrom = `FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id
 JOIN EXAMS ex ON ex.exam_id=fr.exam_id AND ex.offering_id=e.offering_id
 JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id JOIN MODULES m ON m.module_id=mo.module_id
 JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id JOIN PROGRAMME_SEMESTERS ps ON ps.programme_semester_id=m.programme_semester_id
 JOIN PROGRAMMES p ON p.programme_id=ps.programme_id JOIN STUDENTS s ON s.user_id=e.student_id JOIN USERS u ON u.user_id=s.user_id`;

export async function staffResults(userId, role, q = {}) {
  const scope = await staffScope(userId, role),
    args = [];
  let where = "1=1";
  if (scope.departmentId) {
    where += " AND p.department_id=?";
    args.push(scope.departmentId);
  }
  if (q.status) {
    where += " AND fr.status=?";
    args.push(q.status);
  }
  if (q.search) {
    where += " AND (u.name LIKE ? OR s.registration_number LIKE ? OR m.module_code LIKE ?)";
    args.push(...Array(3).fill(`%${q.search}%`));
  }
  const page = q.page || 1,
    pageSize = q.pageSize || 25;
  const [[count], rows] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total ${resultFrom} WHERE ${where}`, args),
    db.query(
      `SELECT fr.result_id AS resultId,u.name AS studentName,s.registration_number AS registrationNumber,
      m.module_code AS moduleCode,m.module_name AS moduleName,sem.semester_name AS semesterName,sem.academic_year AS academicYear,
      e.attempt_number AS attemptNumber,fr.status,
      CASE WHEN fr.status='PUBLISHED' OR ?='MA' THEN fr.exam_grade ELSE NULL END AS examGrade,
      CASE WHEN fr.status='PUBLISHED' OR ?='MA' THEN fr.final_grade ELSE NULL END AS finalGrade,
      fr.published_at AS publishedAt ${resultFrom} WHERE ${where} ORDER BY fr.result_id DESC LIMIT ? OFFSET ?`,
      [role, role, ...args, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return {
    data: rows.map((r) => ({ ...r, publishedAt: campusTimestamp(r.publishedAt) })),
    meta: { page, pageSize, total: Number(count.total) },
  };
}

export async function staffHistory(userId, role, resultId) {
  const scope = await staffScope(userId, role);
  const args = [resultId];
  let where = "fr.result_id=?";
  if (scope.departmentId) {
    where += " AND p.department_id=?";
    args.push(scope.departmentId);
  }
  const [match] = await db.query(`SELECT fr.result_id ${resultFrom} WHERE ${where}`, args);
  if (!match) throw new ApiError(404, "RESULT_NOT_FOUND", "Result not found.");
  const rows = await db.query(
    `SELECT CAST(rsh.history_id AS CHAR) AS id,rsh.from_status AS fromStatus,rsh.to_status AS toStatus,
    rsh.note,u.name AS actor,rsh.changed_at AS changedAt FROM RESULT_STATUS_HISTORY rsh JOIN USERS u ON u.user_id=rsh.updated_by
    WHERE rsh.result_id=? ORDER BY rsh.changed_at,rsh.history_id`,
    [resultId],
  );
  return rows.map((r) => ({ ...r, changedAt: campusTimestamp(r.changedAt) }));
}

export async function staffDashboard(userId, role) {
  const scope = await staffScope(userId, role),
    args = [];
  let where = "1=1";
  if (scope.departmentId) {
    where += " AND p.department_id=?";
    args.push(scope.departmentId);
  }
  const queue = await db.query(
    `SELECT fr.status,COUNT(*) AS count ${resultFrom} WHERE ${where} GROUP BY fr.status`,
    args,
  );
  let summary = {};
  if (role === "ADMIN") {
    const [row] =
      await db.query(`SELECT (SELECT COUNT(*) FROM USERS WHERE is_active=1) AS activeUsers,
      (SELECT COUNT(*) FROM MA_STAFF ma JOIN USERS u ON u.user_id=ma.user_id WHERE u.is_active=1) AS activeMaStaff`);
    summary = row;
  }
  return {
    ...scope,
    summary,
    resultCounts: queue.map((r) => ({ ...r, count: Number(r.count) })),
    generatedAt: new Date().toISOString(),
    integrations: { backups: false, monitoring: false, reports: false, reportApprovals: false },
  };
}

export async function audit(q = {}) {
  const page = q.page || 1,
    pageSize = q.pageSize || 25;
  const [[count], rows] = await Promise.all([
    db.query("SELECT COUNT(*) AS total FROM AUDIT_LOG"),
    db.query(
      `SELECT CAST(a.audit_id AS CHAR) AS id,a.table_name AS resource,CAST(a.row_id AS CHAR) AS rowId,a.action,
      u.name AS actor,a.acted_at AS actedAt FROM AUDIT_LOG a LEFT JOIN USERS u ON u.user_id=a.actor_id
      ORDER BY a.audit_id DESC LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize],
    ),
  ]);
  return {
    data: rows.map((r) => ({ ...r, actedAt: campusTimestamp(r.actedAt) })),
    meta: { page, pageSize, total: Number(count.total) },
  };
}

export async function maStaff(q = {}) {
  const page = q.page || 1,
    pageSize = q.pageSize || 25,
    args = [];
  let where = "1=1";
  if (q.search) {
    where += " AND (u.name LIKE ? OR u.email LIKE ?)";
    args.push(`%${q.search}%`, `%${q.search}%`);
  }
  const from = "FROM MA_STAFF ma JOIN USERS u ON u.user_id=ma.user_id";
  const [[count], rows] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, args),
    db.query(
      `SELECT u.user_id AS id,u.name AS fullName,u.email,u.is_active AS isActive,ma.staff_number AS staffNumber,
      ma.office_name AS officeName,u.last_login_at AS lastLoginAt ${from} WHERE ${where} ORDER BY u.user_id LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return {
    data: rows.map((r) => ({ ...r, lastLoginAt: campusTimestamp(r.lastLoginAt) })),
    meta: { page, pageSize, total: Number(count.total) },
  };
}
