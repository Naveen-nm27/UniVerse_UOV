import { useEffect, useState } from "react";
import { getAcademic, getAcademicResources, getLookup, saveAcademic } from "../../api/ma";
import { Pagination } from "./ManagementUsers";
export default function AcademicSetup() {
  const [resources, setResources] = useState([]);
  const [key, setKey] = useState("departments");
  const [data, setData] = useState(null);
  const [references, setReferences] = useState({});
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const resource = resources.find((item) => item.key === key);
  useEffect(() => {
    const controller = new AbortController();
    getAcademicResources({ signal: controller.signal }).then((response) => { if (!controller.signal.aborted) { setResources(response); setError(""); } }).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    if (!resource?.available) return;
    const controller = new AbortController();
    const refs = [...new Set(resource.fields.map((f) => f.reference).filter(Boolean))];
    Promise.all([getAcademic(key, page, { signal: controller.signal }),
      Promise.all(refs.map(async (ref) => [ref, await getLookup(ref, { signal: controller.signal })]))])
      .then(([response, values]) => { if (!controller.signal.aborted) { setError(""); setData(response); setReferences(Object.fromEntries(values)); } })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [key, page, resource, retry]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const body = {};
    for (const field of resource.fields) body[field.name] = ["number", "select"].includes(field.type) ? Number(form[field.name]) : form[field.name];
    try { await saveAcademic(key, body, form[resource.id]); setForm(null); setRetry((value) => value + 1); setSuccess("Academic record saved."); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function choose(nextKey) { setKey(nextKey); setPage(1); setData(null); setForm(null); setError(""); setSuccess(""); }
  return <>
    <section className="ma-welcome"><div><h1>Academic setup</h1><p>Manage the academic structures used by student services.</p></div></section>
    <div className="ma-tabs" role="group" aria-label="Academic resources">{resources.map((item) => <button key={item.key} className={key === item.key ? "is-active" : ""} onClick={() => choose(item.key)} aria-pressed={key === item.key}>{item.label}</button>)}</div>
    {error && <p className="ma-error" role="alert">{error} <button onClick={() => setRetry((value) => value + 1)}>Try again</button></p>}
    {success && <p className="ma-success" role="status">{success}</p>}
    {!resources.length && !error && <p role="status">Loading academic setup…</p>}
    {resource && !resource.available && <section className="ma-panel"><h2>{resource.label}</h2><p>This resource requires the complete academic database schema before it can be used.</p></section>}
    {resource?.available && <section className="ma-panel"><div className="ma-panel-heading"><h2>{resource.label}</h2>{resource.writable && <button className="ma-button ma-button-primary" onClick={() => setForm({})}>Add record</button>}</div>
      {!resource.writable && <p>{resource.unavailableReason}</p>}
      {form && <form className="ma-form" onSubmit={submit}>{resource.fields.map((field) => <label key={field.name}>{field.label}{field.reference ? <select required value={form[field.name] ?? ""} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}><option value="" disabled>Choose {field.label.toLowerCase()}</option>{(references[field.reference] || []).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select> : <input type={field.type} required={field.required} min={field.min} max={field.type === "number" ? field.max : undefined} maxLength={field.type === "text" ? field.max : undefined} value={form[field.name] ?? ""} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}</label>)}<button className="ma-button ma-button-primary" disabled={busy}>{busy ? "Saving…" : "Save record"}</button><button type="button" onClick={() => setForm(null)}>Cancel</button></form>}
      {!data && !error && <p role="status">Loading records…</p>}{data && !data.data.length && <p>No records have been added.</p>}
      {data?.data.length > 0 && <div className="ma-table-scroll"><table className="ma-table"><thead><tr>{resource.fields.map((field) => <th key={field.name}>{field.label}</th>)}{resource.writable && <th>Action</th>}</tr></thead><tbody>{data.data.map((row) => <tr key={row[resource.id]}>{resource.fields.map((field) => <td key={field.name}>{field.reference ? references[field.reference]?.find((item) => item.id === row[field.name])?.label || row[field.name] : row[field.name]}</td>)}{resource.writable && <td><button onClick={() => setForm({ ...row })}>Edit</button></td>}</tr>)}</tbody></table></div>}
      {data && <Pagination page={page} total={data.meta.total} pageSize={25} onChange={(nextPage) => { setData(null); setPage(nextPage); }} />}
    </section>}
  </>;
}
