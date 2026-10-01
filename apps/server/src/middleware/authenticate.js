import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "development-only-secret-change-me";

/**
 * Authentication middleware
 *
 * Reads the JWT from:
 * Authorization: Bearer <token>
 *
 * Adds the authenticated user to:
 * req.user
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is required.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const userRepository =
      AppDataSource.getRepository("User");

    const user = await userRepository.findOne({
      where: {
        id: Number(decoded.sub),
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const roleCode =
      String(user.role || "student").toUpperCase();

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: user.role || "student",
      roleCode,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

/**
 * Optional authentication middleware.
 *
 * If a valid token is supplied, req.user is populated.
 * If no token is supplied, the request continues normally.
 */
export async function optionalAuthenticate(
  req,
  res,
  next
) {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return next();
    }

    const token = authHeader
      .substring(7)
      .trim();

    if (!token) {
      return next();
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        JWT_SECRET
      );
    } catch {
      return next();
    }

    if (!decoded || !decoded.sub) {
      return next();
    }

    const userRepository =
      AppDataSource.getRepository("User");

    const user = await userRepository.findOne({
      where: {
        id: Number(decoded.sub),
      },
    });

    if (
      user &&
      user.isActive !== false
    ) {
      const roleCode =
        String(
          user.role || "student"
        ).toUpperCase();

      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        role: user.role || "student",
        roleCode,
        isActive: user.isActive,
      };
    }

    next();
  } catch (error) {
    console.error(
      "Optional authentication error:",
      error
    );

    next();
  }
}

/**
 * Role authorization middleware.
 *
 * Example:
 * router.get(
 *   "/admin",
 *   authenticate,
 *   requireRole("ADMIN"),
 *   controller
 * );
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole =
      String(
        req.user.roleCode ||
        req.user.role ||
        ""
      ).toUpperCase();

    const normalizedAllowedRoles =
      allowedRoles.map((role) =>
        String(role).toUpperCase()
      );

    if (
      !normalizedAllowedRoles.includes(
        userRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource.",
      });
    }

    next();
  };
}