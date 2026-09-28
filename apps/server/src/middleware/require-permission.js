export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const permissions = Array.isArray(req.auth.permissions)
      ? req.auth.permissions
      : [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
        },
      });
    }

    next();
  };
}