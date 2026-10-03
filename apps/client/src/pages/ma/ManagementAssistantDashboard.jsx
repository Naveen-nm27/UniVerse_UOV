import { useEffect, useState } from "react";
import { getSession, signOut } from "../../api/client";
import { getMaDashboard } from "../../api/ma";
import ManagementUsers from "./ManagementUsers";
import AcademicSetup from "./AcademicSetup";
import "./ManagementAssistantDashboard.css";
const navigation = [
  ["Overview", "/ma"], ["Users", "/ma/users"], ["Academic setup", "/ma/academic"],
  ["Timetable", "/ma/timetable"], ["Devices", "/ma/devices"], ["Grades", "/ma/grades"],
  ["Result workflow", "/ma/results"], ["Documents", "/ma/documents"], ["Audit activity", "/ma/audit"],
];
export default function ManagementAssistantDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const path = window.location.pathname.replace(/\/$/, "") || "/ma";
  const active = navigation.find(([, href]) => path === href || (href !== "/ma" && path.startsWith(`${href}/`))) || navigation[0];
  const user = getSession()?.user;
  const name = user?.fullName || "Management Assistant";
  return <div className="ma-shell">
    <button className={`ma-scrim ${drawerOpen ? "is-visible" : ""}`} aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
    <aside className={`ma-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Management Assistant navigation">
      <div className="ma-brand"><span className="ma-brand-mark">U</span><span>UniVerse</span></div>
      <div className="ma-role">Management Assistant</div>
      <nav className="ma-nav">{navigation.map(([label, href]) => <a className={`ma-nav-link ${active[1] === href ? "is-active" : ""}`} key={href} href={href} aria-current={active[1] === href ? "page" : undefined}>{label}</a>)}</nav>
      <button className="ma-signout" onClick={signOut}>Sign out</button>
    </aside>
    <div className="ma-main"><header className="ma-topbar">
      <button className="ma-menu-button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>☰</button>
      <div className="ma-breadcrumb"><span>Workspace</span><span>/</span><strong>{active[0]}</strong></div>
      <div className="ma-profile"><span className="ma-avatar">{name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</span><span className="ma-profile-copy"><strong>{name}</strong><small>Management Assistant</small></span></div>
    </header><main className="ma-content">
      {active[1] === "/ma" ? <Overview name={name} /> : active[1] === "/ma/users" ? <ManagementUsers /> : active[1] === "/ma/academic" ? <AcademicSetup /> : <section className="ma-panel"><h1>{active[0]}</h1><p>This feature is awaiting backend and database setup.</p><a className="ma-button ma-button-secondary" href="/ma">Back to overview</a></section>}
    </main></div>
  </div>;
}
function Overview({ name }) {
  const [today] = useState(() => new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Asia/Colombo" }).format(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setError(""); setData(null); return getMaDashboard({ signal: controller.signal });
    }).then((response) => { if (!controller.signal.aborted) setData(response); }).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [retry]);
  const cards = [["Active users", "activeUsers"], ["Lecture sessions today", "todayLectureSessions"], ["Results awaiting action", "resultsAwaitingAction"], ["Operational issues", "operationalIssues"]];
  return <>
    <section className="ma-welcome"><div><p className="ma-eyebrow">{today}</p><h1>Welcome, {name.split(" ")[0]}.</h1><p>Manage accounts and academic setup from your workspace.</p></div><a className="ma-button ma-button-primary" href="/ma/users/new">Create student account</a></section>
    {error && <p className="ma-error" role="alert">{error} <button onClick={() => setRetry((value) => value + 1)}>Try again</button></p>}
    {!data && !error && <p role="status">Loading workspace…</p>}
    <section className="ma-summary-grid" aria-label="Workspace summary">{cards.map(([label, key]) => <article className="ma-summary-card" key={key}><strong className="ma-card-value">{data?.summary[key] ?? "—"}</strong><span className="ma-card-label">{label}</span><span className="ma-card-context">{data?.summary[key] == null ? "Unavailable" : "Current total"}</span></article>)}</section>
    <div className="ma-dashboard-grid"><section className="ma-panel"><h2>Result queue</h2><p>Published results are excluded from this queue.</p>{data?.workQueue.map((item) => <div className="ma-queue-item" key={item.status}><strong>{item.status.replaceAll("_", " ")}</strong><span>{item.count} records</span></div>)}{data && !data.workQueue.length && <p>No results awaiting action.</p>}<p>Result editing and approval are awaiting backend setup.</p></section><section className="ma-panel"><h2>Recent activity</h2><p>Audit activity will be available when the audit backend is connected.</p></section></div>
    <section className="ma-quick-links"><h2>Keep work moving</h2><div className="ma-link-grid"><a href="/ma/users"><div><strong>Manage users</strong><small>Create student accounts and manage access</small></div></a><a href="/ma/academic"><div><strong>Academic setup</strong><small>Departments, programmes, batches and semesters</small></div></a></div></section>
  </>;
}
