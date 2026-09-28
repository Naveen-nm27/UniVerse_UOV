import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";

export async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication token is missing.",
        },
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token.",
        },
      });
    }

    const userRepository = AppDataSource.getRepository("User");

    const user = await userRepository.findOne({
      where: {
        id: userId,
      },

      relations: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User account not found.",
        },
      });
    }

    if (user.active === false) {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Your account is inactive.",
        },
      });
    }

    const roleCode =
      user.role?.code ||
      user.role?.roleCode ||
      user.role_code ||
      user.role;

    if (!roleCode) {
      return res.status(403).json({
        error: {
          code: "ROLE_NOT_CONFIGURED",
          message: "User role is not configured.",
        },
      });
    }

    /*
     * Temporary permission handling.
     *
     * Once the V04 permission tables are mapped,
     * replace this with a database query that calculates
     * the user's effective permissions.
     */
    const permissions = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    req.auth = {
      userId: user.id,
      roleCode: String(roleCode).toUpperCase(),
      permissions,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Your session has expired.",
        },
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token.",
        },
      });
    }

    next(error);
  }
}