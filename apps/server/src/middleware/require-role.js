export function requireRole(...roles) {
  return (req, res, next) => {

    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required."
        }
      });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource."
        }
      });
    }

    next();
  };
}