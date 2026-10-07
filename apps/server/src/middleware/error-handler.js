export function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const code = err?.code || "INTERNAL_SERVER_ERROR";
  const message = err?.message || "An unexpected error occurred.";

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}
