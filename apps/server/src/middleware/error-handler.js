export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const databaseCode = error.driverError?.code || error.code;
  let status = error.statusCode || error.status || 500;
  let code = error.code || "INTERNAL_SERVER_ERROR";
  let message = error.message;
  if (error.name === "ZodError") {
    status = 400; code = "VALIDATION_ERROR";
    message = error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ");
  } else if (error.type === "entity.parse.failed") {
    status = 400; code = "INVALID_JSON"; message = "The request body must contain valid JSON.";
  } else if (databaseCode === "ER_DUP_ENTRY") {
    status = 409; code = "CONFLICT"; message = "A record with these unique details already exists.";
  } else if (["ER_NO_REFERENCED_ROW_2", "ER_ROW_IS_REFERENCED_2"].includes(databaseCode)) {
    status = 409; code = "REFERENCE_CONFLICT"; message = "The selected reference is unavailable or still in use.";
  } else if (["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(databaseCode)) {
    status = 503; code = "SCHEMA_UNAVAILABLE"; message = "This feature requires database setup before it can be used.";
  }
  if (status >= 500) {
    console.error("Request failed", { method: req.method, path: req.path, code: databaseCode });
    if (status !== 503) { code = "INTERNAL_SERVER_ERROR"; message = "An unexpected server error occurred."; }
  }
  res.status(status).json({ error: { code, message } });
}
