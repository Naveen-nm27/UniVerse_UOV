import { useEffect, useState } from "react";
import { getLecturerSessionDetails } from "../../api/lecturer";
import AttendanceTable from "./components/AttendanceTable";
import SessionControls from "./components/SessionControls";
import RequestState from "./components/RequestState";

export default function LecturerSessionDetails({ sessionId, profile, semesterId, patchUrl }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canToggleAttendance, setCanToggleAttendance] = useState(false);
  const [canViewUnpublished, setCanViewUnpublished] = useState(false);

  useEffect(() => {
    getLecturerSessionDetails(sessionId)
      .then((data) => setSession(data || null))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <RequestState status="loading" message="Loading session details…" />;
  if (error) return <RequestState status="error" message={error} />;
  if (!session) return <RequestState status="error" message="This session could not be found." />;

  return (
    <>
      <section className="lecturer-panel">
        <div className="lecturer-panel-header">
          <div>
            <p className="eyebrow">Session details</p>
            <h2>{session.title}</h2>
          </div>
          <a href="/lecturer/sessions" className="secondary-button">Back to sessions</a>
        </div>

        <SessionControls
          canToggleAttendance={canToggleAttendance}
          canViewUnpublished={canViewUnpublished}
          onToggleAttendance={() => setCanToggleAttendance((value) => !value)}
          onToggleUnpublished={() => setCanViewUnpublished((value) => !value)}
        />
      </section>

      <section className="lecturer-grid">
        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Session summary</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Date</strong><span>{session.date}</span></li>
            <li><strong>Time</strong><span>{session.startTime} – {session.endTime}</span></li>
            <li><strong>Location</strong><span>{session.location}</span></li>
            <li><strong>Status</strong><span className={`status-pill status-${String(session.status || "scheduled").toLowerCase().replace(/\s+/g, "-")}`}>{session.status}</span></li>
          </ul>
        </article>

        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Attendance stats</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Present</strong><span>{(session.attendance || []).filter((item) => item.status === "Present").length}</span></li>
            <li><strong>Late</strong><span>{(session.attendance || []).filter((item) => item.status === "Late").length}</span></li>
            <li><strong>Absent</strong><span>{(session.attendance || []).filter((item) => item.status === "Absent").length}</span></li>
          </ul>
        </article>
      </section>

      <section className="lecturer-panel">
        <AttendanceTable rows={session.attendance || []} />
      </section>
    </>
  );
}
