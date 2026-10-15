import { useState } from "react";
import Workspace from "../../components/Workspace";
import { RequestState, Table, Pagination } from "../../components/RemoteData";
import { useRemote } from "../../hooks/use-remote";
import { queryString } from "../../api/client";
const column = (key, label) => ({ key, label });
export default function StaffDashboard({ role }) {
  const root = role.toLowerCase(),
    title = { ADMIN: "Administrator", HOD: "Head of Department", DEAN: "Dean" }[role];
  const navigation =
    role === "ADMIN"
      ? [
          ["Overview", `/${root}`],
          ["MA staff", `/${root}/ma-staff`],
          ["Backup and recovery", `/${root}/backups`],
          ["Audit logs", `/${root}/audit`],
          ["Monitoring", `/${root}/monitoring`],
          ["System reports", `/${root}/reports`],
        ]
      : [
          ["Overview", `/${root}`],
          ["Results", `/${root}/results`],
          ["Report approvals", `/${root}/reports`],
          ["Verification history", `/${root}/history`],
        ];
  const section = window.location.pathname.split("/")[2] || "overview";
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState(null),
    [status, setStatus] = useState("");
  const overview = useRemote("/staff/dashboard");
  const endpoint = {
    overview: "/staff/dashboard",
    "ma-staff": "/staff/ma-staff",
    audit: "/staff/audit",
    results: "/staff/results",
    history: "/staff/results",
  }[section];
  const records = useRemote(
    (endpoint || "/staff/dashboard") +
      queryString(endpoint === "/staff/dashboard" ? {} : { page, status }),
  );
  const unavailable = {
    backups: "Backup and recovery services are not connected.",
    monitoring: "Operational monitoring is not connected.",
    reports: "Report generation and report approval services are not connected.",
  };
  return (
    <Workspace title={title} navigation={navigation}>
      <section className="ma-welcome">
        <div>
          <h1>{title} workspace</h1>
          <p>{overview.data?.data.departmentName || "University of Vavuniya"}</p>
        </div>
      </section>
      <RequestState {...overview} />
      {unavailable[section] ? (
        <section className="ma-panel">
          <h2>{navigation.find(([, href]) => href === window.location.pathname)?.[0]}</h2>
          <p>{unavailable[section]}</p>
        </section>
      ) : !endpoint ? (
        <p role="alert">This page could not be found.</p>
      ) : (
        <>
          <RequestState {...records} />
          {records.data && (
            <section className="ma-panel">
              {section === "overview" && (
                <>
                  <h2>Current overview</h2>
                  <p>Updated {records.data.data.generatedAt}</p>
                  {role === "ADMIN" && (
                    <p>
                      Active users: {records.data.data.summary.activeUsers} · Active MA accounts:{" "}
                      {records.data.data.summary.activeMaStaff}
                    </p>
                  )}
                  <h3>Result statuses</h3>
                  <Table
                    rows={records.data.data.resultCounts}
                    rowKey="status"
                    columns={[column("status", "Status"), column("count", "Records")]}
                  />
                </>
              )}
              {["results", "history"].includes(section) && (
                <>
                  <p>
                    Management Assistants record verification statuses in V04. Published grade
                    values are visible here.
                  </p>
                  <label>
                    Result status{" "}
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                        setSelected(null);
                      }}
                    >
                      <option value="">All statuses</option>
                      {["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "PUBLISHED", "RETURNED"].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <Table
                    rows={records.data.data}
                    rowKey="resultId"
                    columns={[
                      column("moduleCode", "Module"),
                      column("studentName", "Student"),
                      column("registrationNumber", "Registration"),
                      column("attemptNumber", "Attempt"),
                      column("status", "Status"),
                      column("finalGrade", "Final grade"),
                      {
                        key: "history",
                        label: "History",
                        render: (r) => (
                          <button onClick={() => setSelected(r.resultId)}>View history</button>
                        ),
                      },
                    ]}
                  />
                  {selected && <History id={selected} />}
                </>
              )}
              {section === "ma-staff" && (
                <>
                  <p>Account creation is available to authorised Management Assistants.</p>
                  <Table
                    rows={records.data.data}
                    columns={[
                      column("fullName", "Name"),
                      column("email", "Email"),
                      column("staffNumber", "Staff number"),
                      column("officeName", "Office"),
                      {
                        key: "isActive",
                        label: "Account status",
                        render: (r) => (r.isActive ? "Active" : "Inactive"),
                      },
                      column("lastLoginAt", "Last sign-in"),
                    ]}
                  />
                </>
              )}
              {section === "audit" && (
                <Table
                  rows={records.data.data}
                  columns={[
                    column("actedAt", "Date"),
                    column("actor", "Actor"),
                    column("resource", "Resource"),
                    column("rowId", "Record"),
                    column("action", "Action"),
                  ]}
                />
              )}
              <Pagination meta={records.data.meta} onPage={setPage} />
            </section>
          )}
        </>
      )}
    </Workspace>
  );
}
function History({ id }) {
  const history = useRemote(`/staff/results/${id}/history`);
  return (
    <>
      <h3>Result {id} history</h3>
      <RequestState {...history} />
      {history.data && (
        <Table
          rows={history.data.data}
          columns={[
            column("fromStatus", "From"),
            column("toStatus", "To"),
            column("actor", "Recorded by"),
            column("changedAt", "Date"),
            column("note", "Note"),
          ]}
        />
      )}
    </>
  );
}
