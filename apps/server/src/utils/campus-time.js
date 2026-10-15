export function campusDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function campusTimestamp(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value).replace(" ", "T");
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(text) ? text : `${text}+05:30`;
}
