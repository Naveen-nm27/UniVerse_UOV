export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: {
      code:
        error.code ||
        "INTERNAL_SERVER_ERROR",

      message:
        statusCode >= 500
          ? "An unexpected server error occurred."
          : error.message,
    },
  });
}