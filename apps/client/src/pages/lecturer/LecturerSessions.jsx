import { useEffect, useState } from "react";
import { getLecturerSessions } from "../../api/lecturer";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerSessions({ profile, semesterId, patchUrl }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLecturerSessions(semesterId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  if (loading) return <RequestState status="loading" message="Loading lecturer sessions…" />;
  if (error) return <RequestState status="error" message={error} />;

  const changeSemester = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    patchUrl(`/lecturer/sessions${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <section className="lecturer-panel">
        <div className="lecturer-filter-bar">
          <SemesterSelector value={semesterId} onChange={changeSemester} options={semesterOptions} />
        </div>
      </section>

      <section className="lecturer-panel">
        <div className="lecturer-panel-header">
          <h2>Session record</h2>
        </div>
        <div className="table-wrap">
          <table className="lecturer-table">
            <thead>
              <tr>
                <th scope="col">Session</th>
                <th scope="col">Offering</th>
                <th scope="col">Date</th>
                <th scope="col">Location</th>
                <th scope="col">Attendance</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.title}</strong></td>
                  <td>{row.offeringCode}</td>
                  <td>{row.date}</td>
                  <td>{row.location}</td>
                  <td>{row.attendanceCount}/{row.enrolledCount}</td>
                  <td><a className="table-link" href={`/lecturer/sessions/${row.id}`}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
