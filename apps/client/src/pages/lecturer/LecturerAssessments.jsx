import { useEffect, useState } from "react";
import { getLecturerAssessments } from "../../api/lecturer";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerAssessments({ profile, semesterId, patchUrl }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLecturerAssessments(semesterId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  if (loading) return <RequestState status="loading" message="Loading assessment records…" />;
  if (error) return <RequestState status="error" message={error} />;

  const changeSemester = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    patchUrl(`/lecturer/assessments${params.toString() ? `?${params.toString()}` : ""}`);
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
          <h2>Read-only assessment marks</h2>
        </div>
        <div className="table-wrap">
          <table className="lecturer-table">
            <thead>
              <tr>
                <th scope="col">Offering</th>
                <th scope="col">Assessment</th>
                <th scope="col">Type</th>
                <th scope="col">Grade</th>
                <th scope="col">Released</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.assessmentId}>
                  <td>{row.offeringCode}</td>
                  <td>{row.title}</td>
                  <td>{row.type}</td>
                  <td>{row.grade}</td>
                  <td>{row.released}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
