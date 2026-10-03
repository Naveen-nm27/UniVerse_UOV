import { AppDataSource } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
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
  return {
    profile: { fullName: user.name, officeName: "Academic administration" },
    summary: { activeUsers: Number(counts[0].activeUsers), resultsAwaitingAction: Number(counts[0].resultsAwaitingAction),
      todayLectureSessions: null, operationalIssues: null },
    workQueue: queue.map((item) => ({ status: item.status, count: Number(item.count) })),
    recentActivity: null,
    availability: { timetable: false, devices: false, grades: false, results: false, documents: false, audit: false },
    generatedAt: new Date().toISOString(),
  };
}
