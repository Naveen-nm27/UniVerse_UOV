import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required."
        }
      });
    }

    const token = header.substring(7);

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!payload.userId) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token."
        }
      });
    }

    const userRepository =
      AppDataSource.getRepository("User");

    const user = await userRepository.findOne({
      where: {
        userId: Number(payload.userId),
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_SESSION",
          message: "Your session has expired."
        }
      });
    }

    req.auth = {
      userId: user.userId,
      role: user.roleCode
    };

    next();

  } catch (error) {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Please sign in again."
      }
    });
  }
}