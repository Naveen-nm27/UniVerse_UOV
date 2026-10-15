import { ApiError } from "../utils/api-error.js";
export function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source !== "params")
        for (const key of Object.keys(req.params)) {
          if (key in parsed && key in (req.validated || {}) && parsed[key] !== req.validated[key])
            throw new ApiError(
              400,
              "CONFLICTING_ID",
              "The route and request identifiers must agree.",
            );
        }
      req.validated = { ...req.validated, ...parsed };
      next();
    } catch (error) {
      next(error);
    }
  };
}
