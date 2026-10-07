import { useEffect, useState } from "react";
import { getLecturerResultHistory, getLecturerResults } from "../../api/lecturer";
import ResultHistory from "./components/ResultHistory";
import ResultStatusBadge from "./components/ResultStatusBadge";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerResults({ profile, semesterId, patchUrl }) {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getLecturerResults(semesterId),
      getLecturerResultHistory(1),
    ])
      .then(([resultData, historyData]) => {
        setRows(Array.isArray(resultData) ? resultData : []);
        setHistory(Array.isArray(historyData) ? historyData : []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  if (loading) return <RequestState status="loading" message="Loading final results…" />;
  if (error) return <RequestState status="error" message={error} />;

  const changeSemester = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    patchUrl(`/lecturer/results${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <section className="lecturer-panel">
        <div className="lecturer-filter-bar">
          <SemesterSelector value={semesterId} onChange={changeSemester} options={semesterOptions} />
        </div>
      </section>

      <section className="lecturer-grid">
        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h2>Final results</h2>
          </div>
          <div className="table-wrap">
            <table className="lecturer-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Module</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.resultId}>
                    <td>{row.studentName}<div>{row.registrationNumber}</div></td>
                    <td>{row.offeringCode}</td>
                    <td>{row.finalGrade}</td>
                    <td><ResultStatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Result history</h3>
          </div>
          <ResultHistory history={history} />
        </article>
      </section>
    </>
  );
}
