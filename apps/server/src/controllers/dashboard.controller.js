import { getMaDashboard } from "../services/dashboard.service.js";

export async function getDashboard(req, res, next) {
  try {
    const dashboard =
      await getMaDashboard(
        req.auth.userId
      );

    return res.status(200).json({
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}