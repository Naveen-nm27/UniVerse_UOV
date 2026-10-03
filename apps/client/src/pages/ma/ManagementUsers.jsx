import { useEffect, useState } from "react";
import { createUser, getUsers, setUserActive } from "../../api/users";
import { getLookup } from "../../api/ma";
import { getSession } from "../../api/client";
export default function ManagementUsers() {
  const [data, setData] = useState(null);
  const [lookups, setLookups] = useState({ programmes: [], batches: [] });
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
    Promise.all([getLookup("programmes", { signal: controller.signal }), getLookup("batches", { signal: controller.signal })])
      .then(([programmes, batches]) => { if (!controller.signal.aborted) { setLookupError(""); setLookups({ programmes, batches }); } })
      .catch((e) => { if (!controller.signal.aborted) setLookupError(e.message); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setError(""); setData(null); return getUsers({ page, pageSize: 25, q }, { signal: controller.signal });
    }).then((response) => { if (!controller.signal.aborted) setData(response); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [page, q, retry]);
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setError(""); setSuccess("");
    const fields = Object.fromEntries(new FormData(form));
    fields.role = "STUDENT"; fields.batchId = Number(fields.batchId); fields.programmeId = Number(fields.programmeId);
    if (!fields.currentSemester) delete fields.currentSemester; else fields.currentSemester = Number(fields.currentSemester);
    try { await createUser(fields); form.reset(); setShowForm(false); setPage(1); setRetry((value) => value + 1); setSuccess("Student account created. The student must change the temporary password at first sign-in."); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function toggle(user) {
    setBusy(true); setError(""); setSuccess("");
    try { await setUserActive(user.id, !user.isActive); setRetry((value) => value + 1); setSuccess("Account status updated."); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <>
    <section className="ma-welcome"><div><h1>Users</h1><p>Create student accounts and manage account access.</p></div><button className="ma-button ma-button-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "Create student account"}</button></section>
    {error && <p className="ma-error" role="alert">{error} <button onClick={() => setRetry((value) => value + 1)}>Try again</button></p>}
    {success && <p className="ma-success" role="status">{success}</p>}
    {showForm && <section className="ma-panel"><h2>New student account</h2><p>Staff account creation requires the canonical staff profile schema.</p>{lookupError && <p className="ma-error" role="alert">{lookupError}</p>}<form className="ma-form" onSubmit={submit}>
      <Input name="fullName" label="Full name" maxLength={255} required />
      <Input name="email" label="Email" type="email" maxLength={255} required />
      <Input name="password" label="Temporary password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <Input name="registrationNumber" label="Registration number" maxLength={50} required />
      <Choice name="programmeId" label="Programme" choices={lookups.programmes} />
      <Choice name="batchId" label="Batch" choices={lookups.batches} />
      <Input name="startDate" label="Programme start date" type="date" required />
      <Input name="currentSemester" label="Current semester (optional)" type="number" min={1} max={16} />
      <Input name="phone" label="Phone (optional)" type="tel" maxLength={30} />
      <button className="ma-button ma-button-primary" disabled={busy || !lookups.programmes.length || !lookups.batches.length}>{busy ? "Saving…" : "Create account"}</button>
    </form></section>}
    <section className="ma-panel"><form className="ma-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setQ(search.trim()); }}><label>Search users<input value={search} maxLength={100} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label><button className="ma-button ma-button-secondary">Search</button></form>
      {!data && !error && <p role="status">Loading users…</p>}
      {data && !data.data.length && <p>No users match your search.</p>}
      {data?.data.length > 0 && <div className="ma-table-scroll"><table className="ma-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.data.map((user) => <tr key={user.id}><td>{user.fullName}</td><td>{user.email}</td><td>{user.role}</td><td>{user.isActive ? "Active" : "Inactive"}</td><td><button disabled={busy || user.id === getSession()?.user.id} onClick={() => toggle(user)}>{user.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>}
      {data && <Pagination page={page} total={data.meta.total} pageSize={25} onChange={(nextPage) => { setData(null); setPage(nextPage); }} />}
    </section>
  </>;
}
function Input({ label, ...props }) { return <label>{label}<input {...props} /></label>; }
function Choice({ label, choices, ...props }) { return <label>{label}<select {...props} required defaultValue=""><option value="" disabled>Choose {label.toLowerCase()}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>; }
export function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="ma-pagination"><button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {pages} · {total} records</span><button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></div>;
}
