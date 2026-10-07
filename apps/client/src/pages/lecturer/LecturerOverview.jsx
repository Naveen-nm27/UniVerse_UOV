import { useEffect, useState } from "react";
import { getLecturerOfferings, getLecturerOverview, getLecturerSessions } from "../../api/lecturer";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerOverview({ profile, semesterId, patchUrl }) {
  const [overview, setOverview] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getLecturerOverview(semesterId),
      getLecturerOfferings(semesterId),
      getLecturerSessions(semesterId),
    ])
      .then(([overviewData, offeringData, sessionData]) => {
        setOverview(overviewData || {});
        setOfferings(Array.isArray(offeringData) ? offeringData : []);
        setSessions(Array.isArray(sessionData) ? sessionData : []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  const onSemesterChange = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    const nextUrl = `/lecturer${params.toString() ? `?${params.toString()}` : ""}`;
    patchUrl(nextUrl);
  };

  if (loading) return <RequestState status="loading" message="Loading lecturer overview…" />;
  if (error) return <RequestState status="error" message={error} />;

  const summary = overview?.summary || {};

  return (
    <>
      <section className="lecturer-panel lecturer-intro">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Hello, {profile?.fullName ? profile.fullName.split(" ")[0] : "Lecturer"}</h2>
          <p>Manage teaching assignments, monitor student attendance, and review published outcomes.</p>
        </div>
        <div className="lecturer-actions">
          <a href="/lecturer/modules" className="primary-button">View offerings</a>
          <a href="/lecturer/sessions" className="secondary-button">Open sessions</a>
        </div>
      </section>

      <section className="lecturer-panel">
        <div className="lecturer-filter-bar">
          <SemesterSelector value={semesterId} onChange={onSemesterChange} options={semesterOptions} />
        </div>
      </section>

      <section className="lecturer-summary">
        <article className="lecturer-metric">
          <span>Active offerings</span>
          <strong>{summary.activeOfferings ?? offerings.length}</strong>
          <small>Current teaching load</small>
        </article>
        <article className="lecturer-metric">
          <span>Enrolled students</span>
          <strong>{summary.enrolledStudents ?? offerings.reduce((total, item) => total + (item.studentCount || 0), 0)}</strong>
          <small>Across assigned modules</small>
        </article>
        <article className="lecturer-metric">
          <span>Sessions this week</span>
          <strong>{summary.sessionsThisWeek ?? sessions.length}</strong>
          <small>Planned and delivered</small>
        </article>
        <article className="lecturer-metric">
          <span>Attendance rate</span>
          <strong>{summary.attendanceRate ?? 89}%</strong>
          <small>Average across classes</small>
        </article>
      </section>

      <section className="lecturer-grid">
        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Assigned offerings</h3>
            <a href="/lecturer/modules">Open all</a>
          </div>
          <ul className="lecturer-list">
            {(offerings || []).slice(0, 4).map((offering) => (
              <li key={offering.id}>
                <div>
                  <strong>{offering.moduleCode}</strong>
                  <div>{offering.title}</div>
                </div>
                <small>{offering.studentCount} students</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Upcoming sessions</h3>
            <a href="/lecturer/sessions">View all</a>
          </div>
          <ul className="lecturer-list">
            {(sessions || []).slice(0, 4).map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <small>{session.date} · {session.location}</small>
                </div>
                <span>{session.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
