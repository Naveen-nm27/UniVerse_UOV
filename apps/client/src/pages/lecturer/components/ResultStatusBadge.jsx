export default function ResultStatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-pill status-${normalized || "published"}`}>{status || "Published"}</span>;
}
