import { getEffectivePermissions } from "../services/permissions.service.js";
import { ApiError } from "../utils/api-error.js";
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.auth) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
      req.auth.permissions = await getEffectivePermissions(req.auth.userId, req.auth.role);
      if (!req.auth.permissions.includes(permission))
        throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
      next();
    } catch (error) {
      next(error);
    }
  };
}
