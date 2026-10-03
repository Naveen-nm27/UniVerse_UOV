export function validate(schema, source = "body") {
  return (req, res, next) => {
    try { req.validated = schema.parse(req[source]); next(); }
    catch (error) { next(error); }
  };
}
