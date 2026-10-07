import { useEffect, useState } from "react";
import { getLecturerOfferingDetails } from "../../api/lecturer";
import RequestState from "./components/RequestState";

export default function LecturerOfferingDetails({ offeringId, profile, semesterId, patchUrl }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLecturerOfferingDetails(offeringId)
      .then((data) => setItem(data || null))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [offeringId]);

  if (loading) return <RequestState status="loading" message="Loading offering details…" />;
  if (error) return <RequestState status="error" message={error} />;
  if (!item) return <RequestState status="error" message="No offering details found for this module." />;

  return (
    <>
      <section className="lecturer-panel">
        <div className="lecturer-panel-header">
          <div>
            <p className="eyebrow">Offering</p>
            <h2>{item.moduleCode} · {item.title}</h2>
          </div>
          <a href="/lecturer/modules" className="secondary-button">Back to modules</a>
        </div>
      </section>

      <section className="lecturer-grid">
        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Details</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Semester</strong><span>{item.semesterLabel}</span></li>
            <li><strong>Study year</strong><span>{item.studyYear}</span></li>
            <li><strong>Hall</strong><span>{item.hall || "—"}</span></li>
            <li><strong>Students enrolled</strong><span>{item.studentCount}</span></li>
            <li><strong>Attendance rate</strong><span>{item.summary?.attendanceRate ?? 89}%</span></li>
          </ul>
        </article>

        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Current status</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Pending result review</strong><span>{item.summary?.pendingResults ?? 3}</span></li>
            <li><strong>Latest session</strong><span>Lecture 01</span></li>
            <li><strong>Read-only grade access</strong><span>Enabled</span></li>
          </ul>
        </article>
      </section>

      <section className="lecturer-panel">
        <div className="lecturer-panel-header">
          <h3>Class roster</h3>
        </div>
        <div className="table-wrap">
          <table className="lecturer-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Registration</th>
                <th scope="col">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {(item.roster || []).map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.registration}</td>
                  <td>{student.attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
