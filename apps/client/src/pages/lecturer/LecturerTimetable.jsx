import { useEffect, useState } from "react";
import { getLecturerTimetable } from "../../api/lecturer";
import SemesterSelector from "./components/SemesterSelector";
import RequestState from "./components/RequestState";

const semesterOptions = [
  { label: "Semester 1", value: "semester-1" },
  { label: "Semester 2", value: "semester-2" },
  { label: "Summer term", value: "summer-term" },
];

export default function LecturerTimetable({ profile, semesterId, patchUrl }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLecturerTimetable(semesterId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [semesterId]);

  if (loading) return <RequestState status="loading" message="Loading timetable…" />;
  if (error) return <RequestState status="error" message={error} />;

  const changeSemester = (event) => {
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set("semesterId", nextValue);
    else params.delete("semesterId");
    patchUrl(`/lecturer/timetable${params.toString() ? `?${params.toString()}` : ""}`);
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
          <h2>Teaching timetable</h2>
        </div>
        <div className="table-wrap">
          <table className="lecturer-table">
            <thead>
              <tr>
                <th scope="col">Module</th>
                <th scope="col">Day</th>
                <th scope="col">Time</th>
                <th scope="col">Room</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.moduleCode}</strong><div>{row.title}</div></td>
                  <td>{row.day}</td>
                  <td>{row.time}</td>
                  <td>{row.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
