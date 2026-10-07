import { useMemo, useState } from "react";
import "./AdminDashboard.css";

const navigation = [
  "Overview",
  "MA staff",
  "Backup and recovery",
  "Audit logs",
  "Monitoring",
  "System reports",
];

const summaryCards = [
  { label: "Active users", value: "8,942", period: "Last 24 hours", detail: "Updated 08:40 AM", href: "/admin/users" },
  { label: "MA staff accounts", value: "36", period: "Current roster", detail: "Updated 08:40 AM", href: "/admin/ma-staff" },
  { label: "Latest backup", value: "10:15 AM", period: "Last successful job", detail: "On campus storage", href: "/admin/backup" },
  { label: "System health", value: "Stable", period: "Last 15 minutes", detail: "No critical alerts", href: "/admin/monitoring" },
];

const alerts = [
  { title: "Backup job overdue", detail: "Nightly archive did not complete before the expected window.", severity: "high" },
  { title: "Failed login spike", detail: "Multiple invalid sign-ins reported from a single IP range.", severity: "medium" },
  { title: "Storage threshold warning", detail: "Database storage is at 82% with the next alert threshold at 85%.", severity: "low" },
];

const backups = [
  { name: "Nightly database backup", state: "Successful", time: "Today · 10:15 AM", note: "Completed to secure archive storage" },
  { name: "Application snapshot", state: "Overdue", time: "Today · 02:00 AM", note: "Pending review; not connected to the secondary target" },
  { name: "Incremental system backup", state: "Not connected", time: "Last sync unavailable", note: "Remote target not reporting status" },
];

const reportJobs = [
  { name: "Daily access summary", status: "Completed", time: "08:05 AM", owner: "Security automation" },
  { name: "Faculty student count", status: "Pending", time: "Queued 07:20 AM", owner: "Reporting service" },
  { name: "Semester performance export", status: "Failed", time: "Yesterday · 11:10 PM", owner: "Operations team" },
];

const recentActivity = [
  { item: "MA account creation", detail: "Computer Science MA profile updated", time: "08:17 AM" },
  { item: "System alert cleared", detail: "Authentication worker recovered after restart", time: "07:42 AM" },
  { item: "Report generation", detail: "Access review export completed successfully", time: "Yesterday" },
];

export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  const isOverview = activeNav === "Overview";
  const statusTone = useMemo(
    () => ({
      Successful: "good",
      Overdue: "warn",
      "Not connected": "neutral",
      Completed: "good",
      Pending: "warn",
      Failed: "bad",
    }),
    [],
  );

  return (
    <div className="admin-shell">
      <button
        className={`admin-scrim ${drawerOpen ? "is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`admin-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Administrator navigation">
        <div className="admin-brand-wrap">
          <div className="admin-brand">
            <span className="admin-brand-mark">U</span>
            <span>UniVerse</span>
          </div>
        </div>

        <div className="admin-role-tag">
          <span className="admin-role-dot" aria-hidden="true" />
          System administrator
        </div>

        <nav className="admin-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item}
              className={`admin-nav-button ${activeNav === item ? "is-active" : ""}`}
              onClick={() => {
                setActiveNav(item);
                setDrawerOpen(false);
              }}
            >
              <span className="admin-nav-icon" aria-hidden="true">{iconFor(item)}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-help-icon">?</div>
          <div>
            <strong>Operations centre</strong>
            <span>Protected admin access</span>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>
            ☰
          </button>

          <div className="admin-breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="admin-top-actions">
            <button className="admin-icon-button" type="button" aria-label="Notifications">
              <span className="admin-notification-dot" aria-hidden="true" />
              ♡
            </button>

            <div className="admin-profile">
              <span className="admin-avatar">SA</span>
              <div className="admin-profile-copy">
                <strong>System Admin</strong>
                <small>Administrator</small>
              </div>
              <span aria-hidden="true">⌄</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {isOverview ? (
            <>
              <section className="admin-panel intro-panel">
                <div>
                  <p className="admin-section-label">Operational summary</p>
                  <h1>Administrator overview</h1>
                  <p className="admin-intro-copy">System-wide access is governed by backend permissions. Review operational health, backups, alerts and scheduled reporting for the current environment.</p>
                </div>
                <div className="admin-badge-group">
                  <span className="admin-badge admin-badge-primary">Production</span>
                  <span className="admin-badge">Updated 08:40 AM</span>
                </div>
              </section>

              <section className="admin-summary-grid" aria-label="Summary cards">
                {summaryCards.map((card) => (
                  <a className="admin-summary-card" key={card.label} href={card.href}>
                    <div className="admin-card-head">
                      <span className="admin-card-mark">◎</span>
                      <span className="admin-card-tag">Live</span>
                    </div>
                    <strong>{card.value}</strong>
                    <span>{card.label}</span>
                    <small>{card.period}</small>
                    <em>{card.detail}</em>
                  </a>
                ))}
              </section>

              <div className="admin-two-column">
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <p className="admin-section-label">Backup status</p>
                      <h2>Recent backup jobs</h2>
                    </div>
                    <a href="/admin/backup" className="admin-link-button">Open backup centre →</a>
                  </div>

                  <div className="admin-list">
                    {backups.map((item) => (
                      <div key={item.name} className="admin-list-item">
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.note}</small>
                        </div>
                        <div className="admin-meta-block">
                          <span className={`admin-state ${statusTone[item.state] ?? "neutral"}`}>{item.state}</span>
                          <time>{item.time}</time>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <p className="admin-section-label">Alerts</p>
                      <h2>System and security alerts</h2>
                    </div>
                    <a href="/admin/monitoring" className="admin-link-button">Open monitoring →</a>
                  </div>

                  <div className="admin-alert-list">
                    {alerts.map((alert) => (
                      <div key={alert.title} className="admin-alert-item">
                        <span className={`admin-alert-dot ${alert.severity}`} aria-hidden="true" />
                        <div>
                          <strong>{alert.title}</strong>
                          <small>{alert.detail}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="admin-two-column">
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <p className="admin-section-label">Report jobs</p>
                      <h2>Recent report generation</h2>
                    </div>
                    <a href="/admin/reports" className="admin-link-button">View system reports →</a>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Report</th>
                          <th>Status</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportJobs.map((job) => (
                          <tr key={job.name}>
                            <td>
                              <strong>{job.name}</strong>
                              <small>{job.time}</small>
                            </td>
                            <td><span className={`admin-state ${statusTone[job.status] ?? "neutral"}`}>{job.status}</span></td>
                            <td>{job.owner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <p className="admin-section-label">Activity</p>
                      <h2>Recent operations</h2>
                    </div>
                    <a href="/admin/audit" className="admin-link-button">Open audit logs →</a>
                  </div>

                  <div className="admin-activity-list">
                    {recentActivity.map((item) => (
                      <div key={item.item} className="admin-activity-item">
                        <span className="admin-pill">Event</span>
                        <div>
                          <strong>{item.item}</strong>
                          <small>{item.detail}</small>
                        </div>
                        <time>{item.time}</time>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <section className="admin-panel empty-panel">
              <p className="admin-section-label">{activeNav}</p>
              <h2>{activeNav}</h2>
              <p className="admin-empty-copy">This area is prepared for the admin workspace flow. The current task focuses on the operational overview and honest unavailable states where integration data is not yet exposed.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function iconFor(item) {
  switch (item) {
    case "Overview":
      return "◉";
    case "MA staff":
      return "◎";
    case "Backup and recovery":
      return "▣";
    case "Audit logs":
      return "◷";
    case "Monitoring":
      return "⌁";
    case "System reports":
      return "▤";
    default:
      return "•";
  }
}
