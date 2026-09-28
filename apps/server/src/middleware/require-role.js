export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const userRole = String(req.auth.roleCode || "").toUpperCase();

    const roles = allowedRoles.map((role) =>
      String(role).toUpperCase()
    );

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this resource.",
        },
      });
    }

    next();
  };
}