import { useState } from "react";
import Workspace from "../../components/Workspace";
import { RequestState, Table, Pagination } from "../../components/RemoteData";
import { useRemote } from "../../hooks/use-remote";
import { queryString } from "../../api/client";
import { LecturerOverviewCharts } from "../../components/charts/RoleDashboardCharts";
const navigation = [
  ["Overview", "/lecturer"],
  ["Modules", "/lecturer/modules"],
  ["Timetable", "/lecturer/timetable"],
  ["Sessions", "/lecturer/sessions"],
  ["Assessments", "/lecturer/assessments"],
  ["Results", "/lecturer/results"],
  ["Profile", "/lecturer/profile"],
];
const column = (key, label) => ({ key, label });
export default function LecturerDashboard() {
  const path = window.location.pathname.replace(/\/$/, ""),
    profile = useRemote("/lecturer/me");
  const semesters = useRemote("/lecturer/semesters");
  const [semesterId, setSemesterId] = useState(""),
    [page, setPage] = useState(1),
    [selectedResult, setSelectedResult] = useState(null);
  const match = /^\/lecturer\/(modules|sessions)\/(\d+)$/.exec(path);
  const section =
    match?.[1] ||
    (path.split("/")[2] === "dashboard" ? "overview" : path.split("/")[2]) ||
    "overview";
  const params = queryString({ semesterId, page, pageSize: 25 });
  const endpoint = match
    ? `/lecturer/${match[1] === "modules" ? "offerings" : "sessions"}/${match[2]}`
    : `/lecturer/${{ overview: "dashboard", modules: "offerings", profile: "me" }[section] || section}${params}`;
  const result = useRemote(endpoint);
  function filter(value) {
    setSemesterId(value);
    setPage(1);
    setSelectedResult(null);
  }
  const rows = result.data?.data;
  const valid =
    navigation.some(([, href]) => href === path) ||
    Boolean(match) ||
    path === "/lecturer/dashboard";
  return (
    <Workspace title="Lecturer" navigation={navigation}>
      <section className="ma-welcome">
        <div>
          <h1>{navigation.find(([, href]) => href === path)?.[0] || "Teaching workspace"}</h1>
          <p>{profile.data?.data.department || "University of Vavuniya"}</p>
        </div>
      </section>
      <RequestState {...profile} />
      {!valid ? (
        <p role="alert">This lecturer page could not be found.</p>
      ) : (
        <>
          {!match && section !== "profile" && (
            <label>
              Calendar semester{" "}
              <select value={semesterId} onChange={(e) => filter(e.target.value)}>
                <option value="">All assigned semesters</option>
                {semesters.data?.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <RequestState {...result} />
          {result.data && (
            <section className="ma-panel">
              {section === "overview" && (
                <>
                  <h2>Teaching overview</h2>
                  <div className="ma-summary-grid">
                    {[
                      ["Assigned offerings", "activeOfferings"],
                      ["Distinct registered students", "enrolledStudents"],
                      ["Sessions in the last 7 days", "sessionsThisWeek"],
                    ].map(([label, key]) => (
                      <article className="ma-summary-card" key={key}>
                        <strong className="ma-card-value">{rows.summary[key]}</strong>
                        <span>{label}</span>
                      </article>
                    ))}
                  </div>
                  <LecturerOverviewCharts data={rows} />
                  <p>
                    Attendance records are available per session. Missing scans are shown as not
                    recorded.
                  </p>
                </>
              )}
              {section === "profile" && (
                <>
                  <h2>{rows.fullName}</h2>
                  <p>{rows.email}</p>
                  <p>
                    {rows.department} · {rows.staffNumber || "Staff number unavailable"}
                  </p>
                  <p>Joined: {rows.dateJoined}</p>
                  <p>
                    Sessions are controlled by hall terminals. Hardware integration is not
                    connected.
                  </p>
                </>
              )}
              {section === "modules" &&
                (match ? (
                  <OfferingDetails offering={rows} id={match[2]} />
                ) : (
                  <Table
                    rows={rows}
                    columns={[
                      column("moduleCode", "Code"),
                      column("title", "Module"),
                      column("semesterLabel", "Semester"),
                      column("hall", "Hall"),
                      column("studentCount", "Current registered students"),
                      {
                        key: "view",
                        label: "Details",
                        render: (r) => <a href={`/lecturer/modules/${r.id}`}>View offering</a>,
                      },
                    ]}
                  />
                ))}
              {section === "timetable" && (
                <Table
                  rows={rows}
                  columns={[
                    column("moduleCode", "Module"),
                    column("day", "Day"),
                    column("time", "Time"),
                    column("room", "Hall"),
                    column("effectiveFrom", "Effective from"),
                    column("effectiveUntil", "Effective until"),
                  ]}
                />
              )}
              {section === "sessions" &&
                (match ? (
                  <SessionDetails item={rows} id={match[2]} />
                ) : (
                  <Table
                    rows={rows}
                    columns={[
                      column("title", "Module"),
                      column("date", "Date"),
                      column("location", "Hall"),
                      column("status", "State"),
                      column("attendanceCount", "Recorded scans"),
                      column("enrolledCount", "Current registered students"),
                      {
                        key: "view",
                        label: "Details",
                        render: (r) => <a href={`/lecturer/sessions/${r.id}`}>View session</a>,
                      },
                    ]}
                  />
                ))}
              {section === "assessments" && (
                <>
                  <p>Grades are shown after final-result publication.</p>
                  <Table
                    rowKey="rowKey"
                    rows={rows.map((r) => ({
                      ...r,
                      rowKey: `${r.assessmentId}-${r.enrollmentId}`,
                    }))}
                    columns={[
                      column("offeringCode", "Module"),
                      column("studentName", "Student"),
                      column("registrationNumber", "Registration"),
                      column("title", "Assessment"),
                      column("icaNumber", "ICA number"),
                      column("grade", "Grade"),
                    ]}
                  />
                </>
              )}
              {section === "results" && (
                <>
                  <p>Unpublished grade values are withheld. Result statuses remain visible.</p>
                  <Table
                    rows={rows}
                    rowKey="resultId"
                    columns={[
                      column("offeringCode", "Module"),
                      column("studentName", "Student"),
                      column("registrationNumber", "Registration"),
                      column("finalGrade", "Final grade"),
                      column("status", "Status"),
                      {
                        key: "history",
                        label: "Details",
                        render: (r) => (
                          <button onClick={() => setSelectedResult(r.resultId)}>View result</button>
                        ),
                      },
                    ]}
                  />
                  {selectedResult && <ResultDetails id={selectedResult} />}
                </>
              )}
              <Pagination meta={result.data.meta} onPage={setPage} />
            </section>
          )}
        </>
      )}
    </Workspace>
  );
}
function OfferingDetails({ offering, id }) {
  const [page, setPage] = useState(1),
    roster = useRemote(`/lecturer/offerings/${id}/students?page=${page}`);
  return (
    <>
      <h2>
        {offering.moduleCode} · {offering.title}
      </h2>
      <p>
        {offering.semesterLabel} · {offering.hall}
      </p>
      <h3>Enrollment attempts</h3>
      <RequestState {...roster} />
      {roster.data && (
        <>
          <Table
            rows={roster.data.data}
            rowKey="enrollmentId"
            columns={[
              column("name", "Student"),
              column("registrationNumber", "Registration"),
              column("batch", "Batch"),
              column("attemptNumber", "Attempt"),
              column("enrollmentStatus", "Status"),
            ]}
          />
          <Pagination meta={roster.data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
function SessionDetails({ item, id }) {
  const [page, setPage] = useState(1),
    attendance = useRemote(`/lecturer/sessions/${id}/attendance?page=${page}`);
  return (
    <>
      <h2>{item.title}</h2>
      <p>
        {item.date} · {item.location} · {item.status}
      </p>
      <p>
        Opened: {item.openedAt} · Closed: {item.closedAt || "Still open"}
      </p>
      <p>
        This view uses current enrollment and recorded attendees. Missing scans remain not recorded.
      </p>
      <RequestState {...attendance} />
      {attendance.data && (
        <>
          <p>
            {Object.entries(attendance.data.meta.summary)
              .map(([label, count]) => `${label}: ${count}`)
              .join(" · ")}
          </p>
          <Table
            rows={attendance.data.data}
            rowKey="studentId"
            columns={[
              column("name", "Student"),
              column("registrationNumber", "Registration"),
              column("status", "Attendance"),
              column("scanTime", "Scanned at"),
            ]}
          />
          <Pagination meta={attendance.data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
function ResultDetails({ id }) {
  const detail = useRemote(`/lecturer/results/${id}`),
    history = useRemote(`/lecturer/results/${id}/history`);
  return (
    <div>
      <h3>Selected result</h3>
      <RequestState {...detail} />
      {detail.data && (
        <p>
          {detail.data.data.studentName} · {detail.data.data.examType} · Exam grade:{" "}
          {detail.data.data.examGrade || "Withheld"} · Final grade:{" "}
          {detail.data.data.finalGrade || "Withheld"}
        </p>
      )}
      <RequestState {...history} />
      {history.data && (
        <Table
          rows={history.data.data}
          columns={[
            column("fromStatus", "From"),
            column("action", "To"),
            column("by", "Recorded by"),
            column("at", "Date"),
            column("note", "Note"),
          ]}
        />
      )}
    </div>
  );
}
