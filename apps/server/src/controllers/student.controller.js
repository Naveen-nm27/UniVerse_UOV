import {
  getStudentDashboard
} from "../services/student-dashboard.service.js";

export async function dashboard(req, res, next) {
  try {

    const data =
      await getStudentDashboard(
        req.auth.userId
      );

    res.json({
      data
    });

  } catch (error) {
    next(error);
  }
}