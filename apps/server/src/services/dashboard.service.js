import { AppDataSource } from "../data-source.js";

export async function getMaDashboard(userId) {
  const userRepository =
    AppDataSource.getRepository("User");

  const user = await userRepository.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error(
      "User account not found."
    );

    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";

    throw error;
  }

const roleCode =
  String(user.role || "student").toUpperCase();

  return {
    profile: {
      fullName:
        user.fullName ||
        user.full_name ||
        user.name ||
        "",

      officeName:
        user.officeName ||
        user.office_name ||
        "",
    },

    summary: {
      activeUsers: 0,
      todayLectureSessions: 0,
      resultsAwaitingAction: 0,
      operationalIssues: 0,
    },

    workQueue: [],

    recentActivity: [],

    generatedAt:
      new Date().toISOString(),
  };
}