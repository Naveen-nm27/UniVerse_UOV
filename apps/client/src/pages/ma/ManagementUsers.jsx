import { useEffect, useState } from "react";
import { createUser, getUsers, getUserSummary, setUserActive } from "../../api/users";
import { getLookup } from "../../api/ma";
import { getSession } from "../../api/client";
import DashboardChart from "../../components/charts/DashboardChart";
const roleLabels = {
  STUDENT: "Students",
  LECTURER: "Lecturers",
  HOD: "Heads of department",
  DEAN: "Deans",
  MA: "Management assistants",
  ADMIN: "Administrators",
};
export default function ManagementUsers() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lookups, setLookups] = useState({ programmes: [], batches: [], departments: [] });
  const [role, setRole] = useState("STUDENT");
  const [lookupError, setLookupError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(window.location.pathname.endsWith("/new"));
  useEffect(() => {
    const controller = new AbortController();
    getUserSummary({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setSummary(response);
          setSummaryError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setSummary(null);
          setSummaryError(e.message);
        }
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getLookup("programmes", { signal: controller.signal }),
      getLookup("batches", { signal: controller.signal }),
      getLookup("departments", { signal: controller.signal }),
    ])
      .then(([programmes, batches, departments]) => {
        if (!controller.signal.aborted) {
          setLookupError("");
          setLookups({ programmes, batches, departments });
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setLookupError(e.message);
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return;
        setError("");
        setData(null);
        return getUsers(
          { page, pageSize: 25, q, role: roleFilter, status: statusFilter },
          { signal: controller.signal },
        );
      })
      .then((response) => {
        if (!controller.signal.aborted) setData(response);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [page, q, roleFilter, statusFilter, retry]);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setSuccess("");
    const fields = Object.fromEntries(new FormData(form));
    fields.role = role;
    for (const key of ["batchId", "programmeId", "departmentId"])
      if (key in fields) fields[key] = Number(fields[key]);
    for (const key of ["phone", "staffNumber", "officeName"])
      if (fields[key] === "") delete fields[key];
    if (!fields.currentSemester) delete fields.currentSemester;
    else fields.currentSemester = Number(fields.currentSemester);
    try {
      await createUser(fields);
      form.reset();
      setShowForm(false);
      setPage(1);
      setRetry((value) => value + 1);
      setSuccess("Account created. The user must change the temporary password at first sign-in.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(user) {
    if (!window.confirm(`${user.isActive ? "Deactivate" : "Activate"} ${user.fullName}'s account?`))
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await setUserActive(user.id, !user.isActive);
      setRetry((value) => value + 1);
      setSuccess("Account status updated.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="ma-welcome">
        <div>
          <h1>Users</h1>
          <p>Create university accounts and manage account access.</p>
        </div>
        <button className="ma-button ma-button-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close form" : "Create account"}
        </button>
      </section>
      {error && (
        <p className="ma-error" role="alert">
          {error} <button onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </p>
      )}
      {success && (
        <p className="ma-success" role="status">
          {success}
        </p>
      )}
      {summaryError && (
        <p className="ma-error" role="alert">
          User totals could not be loaded. {summaryError}{" "}
          <button onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </p>
      )}
      {!summary && !summaryError && <p role="status">Loading user totals…</p>}
      {summary && (
        <section className="ma-users-overview" aria-label="University user totals">
          <div className="ma-summary-grid ma-user-totals">
            {[
              ["Total users", summary.total],
              ["Students", summary.byRole.find((item) => item.role === "STUDENT")?.total ?? 0],
              ["Lecturers", summary.byRole.find((item) => item.role === "LECTURER")?.total ?? 0],
              ["Inactive accounts", summary.inactive],
            ].map(([label, count]) => (
              <article className="ma-summary-card" key={label}>
                <span className="ma-card-label">{label}</span>
                <strong className="ma-card-value">{count.toLocaleString()}</strong>
                <span className="ma-card-context">Across all accounts</span>
              </article>
            ))}
          </div>
          <DashboardChart
            title="Users by role"
            description="University-wide account totals, including inactive accounts. List filters apply to the table below."
            labels={summary.byRole.map((item) => roleLabels[item.role])}
            datasets={[{ label: "Users", data: summary.byRole.map((item) => item.total) }]}
            horizontal
            height={240}
            axisLabel="Users"
          />
        </section>
      )}
      {showForm && (
        <section className="ma-panel">
          <h2>New university account</h2>
          {lookupError && (
            <p className="ma-error" role="alert">
              {lookupError}
            </p>
          )}
          <form className="ma-form" onSubmit={submit}>
            <label>
              Account role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {["STUDENT", "LECTURER", "HOD", "DEAN", "MA", "ADMIN"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <Input name="fullName" label="Full name" maxLength={255} required />
            <Input name="email" label="Email" type="email" maxLength={255} required />
            <Input
              name="password"
              label="Temporary password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            {role === "STUDENT" && (
              <>
                <Input
                  name="registrationNumber"
                  label="Registration number"
                  maxLength={50}
                  required
                />
                <Choice name="programmeId" label="Programme" choices={lookups.programmes} />
                <Choice name="batchId" label="Batch" choices={lookups.batches} />
                <Input name="startDate" label="Programme start date" type="date" required />
                <Input
                  name="currentSemester"
                  label="Current semester (optional)"
                  type="number"
                  min={1}
                  max={16}
                />
              </>
            )}
            {["LECTURER", "HOD", "DEAN"].includes(role) && (
              <Choice name="departmentId" label="Department" choices={lookups.departments} />
            )}
            {["LECTURER", "HOD"].includes(role) && (
              <Input name="dateJoined" label="Date joined" type="date" required />
            )}
            {role === "DEAN" && (
              <Input name="appointedAt" label="Appointment date" type="date" required />
            )}
            {["LECTURER", "HOD", "MA"].includes(role) && (
              <Input name="staffNumber" label="Staff number (optional)" maxLength={50} />
            )}
            {role === "MA" && <Input name="officeName" label="Office (optional)" maxLength={100} />}
            {role === "ADMIN" && (
              <Input name="adminLevel" label="Admin level" maxLength={50} required />
            )}
            <Input name="phone" label="Phone (optional)" type="tel" maxLength={30} />
            <button
              className="ma-button ma-button-primary"
              disabled={
                busy ||
                (role === "STUDENT" && (!lookups.programmes.length || !lookups.batches.length))
              }
            >
              {busy ? "Saving…" : "Create account"}
            </button>
          </form>
        </section>
      )}
      <section className="ma-panel">
        <h2>User directory</h2>
        <form
          className="ma-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
        >
          <label>
            Search users
            <input
              type="search"
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
            />
          </label>
          <label>
            Filter by role
            <select
              name="roleFilter"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Account status
            <select
              name="statusFilter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <button className="ma-button ma-button-secondary">Search</button>
          <button
            type="button"
            className="ma-button ma-button-secondary"
            disabled={!search && !q && !roleFilter && !statusFilter}
            onClick={() => {
              setSearch("");
              setQ("");
              setRoleFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </form>
        {!data && !error && <p role="status">Loading users…</p>}
        {data && !data.data.length && <p role="status">No users match these filters.</p>}
        {data?.data.length > 0 && (
          <div className="ma-table-scroll">
            <table className="ma-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        disabled={busy || user.id === getSession()?.user.id}
                        onClick={() => toggle(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination
            page={page}
            total={data.meta.total}
            pageSize={25}
            onChange={(nextPage) => {
              setData(null);
              setPage(nextPage);
            }}
          />
        )}
      </section>
    </>
  );
}
function Input({ label, ...props }) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  );
}
function Choice({ label, choices, ...props }) {
  return (
    <label>
      {label}
      <select {...props} required defaultValue="">
        <option value="" disabled>
          Choose {label.toLowerCase()}
        </option>
        {choices.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="ma-pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages} · {total} records
      </span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
