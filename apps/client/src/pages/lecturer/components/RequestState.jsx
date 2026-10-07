export default function RequestState({ status = "loading", message }) {
  if (status === "error") {
    return <div className="request-state request-error" role="alert">{message || "Something went wrong."}</div>;
  }

  if (status === "denied") {
    return <div className="request-state request-denied" role="alert">{message || "Access denied."}</div>;
  }

  return <div className="request-state request-loading" role="status">{message || "Loading…"}</div>;
}
