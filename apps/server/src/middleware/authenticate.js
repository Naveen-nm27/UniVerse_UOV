import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source.js";
import { getJwtSecret, sessionUser } from "../config/auth.js";
import { ApiError } from "../utils/api-error.js";
export async function authenticate(req, res, next) {
  try {
    const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || "");
    if (!match) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
    let payload;
    const secret = getJwtSecret();
    try { payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] }); }
    catch { throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again."); }
    const subject = payload.sub ?? payload.userId; // Accept existing student tokens.
    const userId = Number(subject);
    if (!/^\d+$/.test(String(subject)) || !Number.isSafeInteger(userId) || userId <= 0)
      throw new ApiError(401, "INVALID_SESSION", "Please sign in again.");
    const user = await AppDataSource.getRepository("User").findOneBy({ userId, isActive: true });
    if (!user) throw new ApiError(401, "INVALID_SESSION", "Your session is no longer active.");
    if (user.mustChangePassword && !["/api/users/password", "/api/users/me"].includes(req.originalUrl.split("?")[0]))
      throw new ApiError(403, "PASSWORD_CHANGE_REQUIRED", "Change your temporary password before opening your workspace.");
    req.auth = { userId: user.userId, role: user.roleCode, roleCode: user.roleCode };
    req.user = sessionUser(user);
    res.setHeader("Cache-Control", "private, no-store");
    next();
  } catch (error) { next(error); }
}
export function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}
export { requireRole } from "./require-role.js";
