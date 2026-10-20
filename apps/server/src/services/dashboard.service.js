import { AppDataSource } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
import { getSchema } from "./schema.service.js";
import { campusDate } from "../utils/campus-time.js";

export async function getMaDashboard(userId) {
  const [user, counts, queue] = await Promise.all([
    AppDataSource.getRepository("User").findOneBy({ userId }),
    AppDataSource.query(`SELECT
      (SELECT COUNT(*) FROM USERS WHERE is_active = 1) AS activeUsers,
      (SELECT COUNT(*) FROM FINAL_RESULTS WHERE status IN ('ENTERED', 'VALIDATED', 'WITH_DEAN_OFFICE', 'RETURNED')) AS resultsAwaitingAction`),
    AppDataSource.query(`SELECT status, COUNT(*) AS count FROM FINAL_RESULTS
      WHERE status IN ('ENTERED', 'VALIDATED', 'WITH_DEAN_OFFICE', 'RETURNED') GROUP BY status`),
  ]);

  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User account not found.");

  const schema = await getSchema();

  let todayLectureSessions = null;

  if (schema.has("LECTURE_SESSIONS")) {
    const [row] = await AppDataSource.query(
      "SELECT COUNT(*) AS total FROM LECTURE_SESSIONS WHERE session_date=?",
      [campusDate()],
    );
    todayLectureSessions = Number(row.total);
  }

  return {
    profile: { fullName: user.name, officeName: "Academic administration" },
    summary: {
      activeUsers: Number(counts[0].activeUsers),
      resultsAwaitingAction: Number(counts[0].resultsAwaitingAction),
      todayLectureSessions,
      operationalIssues: null,
    },
    workQueue: queue.map((item) => ({ status: item.status, count: Number(item.count) })),
    recentActivity: null,
    availability: {
      timetable: false,
      devices: false,
      grades: schema.has("MA_STAFF") && schema.has("PERMISSIONS") && schema.has("GRADE_SCALE"),
      results: schema.has("RESULT_STATUS_HISTORY") && schema.has("MA_STAFF"),
      documents: false,
      audit: schema.has("AUDIT_LOG"),
    },
    generatedAt: new Date().toISOString(),
  };
}
