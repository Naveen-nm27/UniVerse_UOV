import { AppDataSource } from "../data-source.js";

export async function requireLecturerProfile(req, res, next) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required.",
        },
      });
    }

    const [lecturer] = await AppDataSource.query(
      `
        SELECT l.user_id AS userId,
               l.department_id AS departmentId,
               l.is_hod AS isHod,
               l.staff_number AS staffNumber,
               l.date_joined AS dateJoined,
               d.department_code AS departmentCode,
               d.department_name AS departmentName
        FROM LECTURERS l
        LEFT JOIN DEPARTMENTS d ON d.department_id = l.department_id
        WHERE l.user_id = ?
      `,
      [req.auth.userId]
    );

    if (!lecturer) {
      return res.status(403).json({
        error: {
          code: "LECTURER_PROFILE_REQUIRED",
          message: "A lecturer profile is required to access this workspace.",
        },
      });
    }

    req.lecturer = lecturer;
    next();
  } catch (error) {
    next(error);
  }
}
