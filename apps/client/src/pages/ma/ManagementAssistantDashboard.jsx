import { useState } from "react";
import "./ManagementAssistantDashboard.css";

const navigation = [
  { label: "Overview", icon: "⌂", href: "/ma" },
  {
    label: "People & setup",
    icon: "＋",
    items: ["Users", "Academic setup"],
  },
  {
    label: "Operations",
    icon: "▦",
    items: ["Timetable", "Devices"],
  },
  {
    label: "Results",
    icon: "✓",
    items: ["Grades", "Result workflow"],
  },
  { label: "Documents", icon: "▤" },
  { label: "Audit activity", icon: "◷" },
];

const summaryCards = [
  { label: "Active users", context: "Current total", icon: "◉", href: "/ma/users" },
  { label: "Lecture sessions", context: "Today", icon: "▣", href: "/ma/timetable" },
  { label: "Results awaiting action", context: "Current queue", icon: "↗", href: "/ma/results" },
  { label: "Operational issues", context: "Timetable & devices", icon: "!", href: "/ma/devices" },
];

const queueItems = [
  { type: "Results", title: "Your work queue will appear here", detail: "Connect the dashboard summary endpoint to load priority items.", tone: "pink" },
  { type: "Timetable", title: "No timetable conflicts loaded", detail: "Conflicts and inactive slots will be surfaced here.", tone: "peach" },
];

export default function ManagementAssistantDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const session = readSession();
  const displayName = session?.user?.fullName || "Management Assistant";
  const officeName = session?.user?.officeName || "Academic administration";
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="ma-shell">
      <button className={`ma-scrim ${drawerOpen ? "is-visible" : ""}`} aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
      <aside className={`ma-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Management Assistant navigation">
        <div className="ma-brand"><span className="ma-brand-mark">U</span><span>UniVerse</span></div>
        <div className="ma-role"><span className="ma-role-dot" /> Management Assistant</div>
        <nav className="ma-nav">
          {navigation.map((item) => (
            <div className="ma-nav-group" key={item.label}>
              <a className={`ma-nav-link ${item.label === "Overview" ? "is-active" : ""}`} href={item.href || "#"} onClick={() => setDrawerOpen(false)}>
                <span className="ma-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
                {item.items && <span className="ma-nav-chevron" aria-hidden="true">⌄</span>}
              </a>
              {item.items && <div className="ma-subnav">{item.items.map((child) => <a href="#" key={child} onClick={() => setDrawerOpen(false)}>{child}</a>)}</div>}
            </div>
          ))}
        </nav>
        <div className="ma-sidebar-footer"><div className="ma-help-icon">?</div><div><strong>Need a hand?</strong><span>Open the support centre</span></div><span aria-hidden="true">→</span></div>
      </aside>

      <div className="ma-main">
        <header className="ma-topbar">
          <button className="ma-menu-button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>☰</button>
          <div className="ma-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>Overview</strong></div>
          <div className="ma-top-actions">
            <button className="ma-icon-button" aria-label="View notifications"><span className="ma-notification-dot" />♧</button>
            <div className="ma-profile"><span className="ma-avatar">{initials(displayName)}</span><span className="ma-profile-copy"><strong>{displayName}</strong><small>Management Assistant</small></span><span aria-hidden="true">⌄</span></div>
          </div>
        </header>

        <main className="ma-content">
          <section className="ma-welcome ma-reveal">
            <div><p className="ma-eyebrow">{today}</p><h1>Good morning, {firstName(displayName)}.</h1><p className="ma-welcome-copy">Here is what needs your attention across {officeName.toLowerCase()} today.</p></div>
            <div className="ma-header-actions"><a className="ma-button ma-button-secondary" href="/ma/grades/ica"><span aria-hidden="true">＋</span> Enter grades</a><a className="ma-button ma-button-primary" href="/ma/users/new"><span aria-hidden="true">＋</span> Create user</a></div>
          </section>

          <section className="ma-summary-grid" aria-label="Workspace summary">
            {summaryCards.map((card, index) => <a className={`ma-summary-card ma-reveal delay-${index + 1}`} href={card.href} key={card.label}><div className="ma-card-top"><span className="ma-card-icon">{card.icon}</span><span className="ma-card-arrow" aria-hidden="true">↗</span></div><strong className="ma-card-value">—</strong><span className="ma-card-label">{card.label}</span><span className="ma-card-context">{card.context} <em>Data will load from the API</em></span></a>)}
          </section>

          <div className="ma-dashboard-grid">
            <section className="ma-panel ma-queue-panel ma-reveal delay-2"><div className="ma-panel-heading"><div><p className="ma-eyebrow">Priority queue</p><h2>What needs attention</h2></div><a href="/ma/results">View all <span aria-hidden="true">→</span></a></div><div className="ma-queue-list">{queueItems.map((item) => <div className="ma-queue-item" key={item.title}><span className={`ma-queue-mark ${item.tone}`}>{item.type === "Results" ? "↗" : "▦"}</span><div><span className="ma-item-type">{item.type}</span><h3>{item.title}</h3><p>{item.detail}</p></div><span className="ma-queue-arrow" aria-hidden="true">→</span></div>)}</div></section>
            <section className="ma-panel ma-activity-panel ma-reveal delay-3"><div className="ma-panel-heading"><div><p className="ma-eyebrow">Audit trail</p><h2>Recent activity</h2></div><a href="/ma/audit" aria-label="View all recent activity">View all <span aria-hidden="true">→</span></a></div><div className="ma-empty-state"><span className="ma-empty-icon">◷</span><h3>No activity yet</h3><p>Recent changes made in your workspace will appear here.</p></div></section>
          </div>

          <section className="ma-quick-links ma-reveal delay-3"><div><p className="ma-eyebrow">Shortcuts</p><h2>Keep work moving</h2></div><div className="ma-link-grid"><a href="/ma/timetable"><span>▦</span><div><strong>Manage timetable</strong><small>Offerings, halls and recurring slots</small></div><b>→</b></a><a href="/ma/devices"><span>⌁</span><div><strong>Check devices</strong><small>Review hall assignments and status</small></div><b>→</b></a><a href="/ma/academic"><span>◇</span><div><strong>Academic setup</strong><small>Programmes, batches and modules</small></div><b>→</b></a></div></section>
        </main>
      </div>
    </div>
  );
}

function readSession() {
  try {
    const raw = localStorage.getItem("universe_session") || sessionStorage.getItem("universe_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function firstName(name) { return name.split(" ")[0]; }
function initials(name) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
