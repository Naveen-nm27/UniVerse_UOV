import { useEffect, useState } from "react";
import { getLecturerOfferings } from "../../api/lecturer";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerOfferings({ profile, semesterId, patchUrl }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLecturerOfferings(semesterId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  if (loading) return <RequestState status="loading" message="Loading assigned offerings…" />;
  if (error) return <RequestState status="error" message={error} />;

  const changeSemester = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    patchUrl(`/lecturer/modules${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <section className="lecturer-panel">
        <div className="lecturer-filter-bar">
          <SemesterSelector value={semesterId} onChange={changeSemester} options={semesterOptions} />
          <a href="/lecturer" className="secondary-button">Back to overview</a>
        </div>
      </section>

      <section className="lecturer-panel">
        <div className="lecturer-panel-header">
          <h2>Assigned module offerings</h2>
        </div>

        <div className="table-wrap">
          <table className="lecturer-table">
            <caption>Assigned teaching work</caption>
            <thead>
              <tr>
                <th scope="col">Module</th>
                <th scope="col">Semester</th>
                <th scope="col">Hall</th>
                <th scope="col">Students</th>
                <th scope="col">Attendance</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.moduleCode}</strong><div>{item.title}</div></td>
                  <td>{item.semesterLabel}</td>
                  <td>{item.hall || "—"}</td>
                  <td>{item.studentCount}</td>
                  <td>{item.attendanceRate ?? 0}%</td>
                  <td><a className="table-link" href={`/lecturer/modules/${item.id}`}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
