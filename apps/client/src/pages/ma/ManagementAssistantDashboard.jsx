import "./ManagementAssistantDashboard.css";

const navItems = [
  "Overview",
  "Users",
  "Academic setup",
  "Timetable",
  "Devices",
  "Grades",
  "Result workflow",
  "Documents",
  "Audit activity",
];

const summaryCards = [
  { label: "Active users", value: "2,481", context: "Across all roles" },
  { label: "Lecture sessions", value: "38", context: "Today" },
  { label: "Results awaiting action", value: "16", context: "Requires review" },
  { label: "Device issues", value: "03", context: "Needs attention" },
];

const workQueue = [
  { title: "Returned results needing correction", meta: "12 records • Faculty of Computing" },
  { title: "Timetable conflicts reported", meta: "04 clashes • Semester 1" },
  { title: "Inactive fingerprint devices", meta: "02 halls • Last sync 2 days ago" },
  { title: "Results awaiting validation", meta: "06 final results • Dean office" },
];

const recentActivity = [
  { action: "Created student account", detail: "A. Perera • 2026/CS/104", time: "09:42" },
  { action: "Updated module offering", detail: "CS 2013 • Semester 1", time: "08:15" },
  { action: "Published result summary", detail: "Level 2 • Faculty of Computing", time: "Yesterday" },
  { action: "Assigned device", detail: "Hall A-102 • Fingerprint terminal", time: "Mon" },
];

export default function ManagementAssistantDashboard() {
  return (
    <div className="ma-dashboard">
      <aside className="ma-sidebar" aria-label="Management Assistant navigation">
        <div className="sidebar-brand">
          <span className="brand-icon">U</span>
          <span>UniVerse</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${index === 0 ? "active" : ""}`}
              aria-current={index === 0 ? "page" : undefined}
            >
              <span className="nav-bullet" aria-hidden="true" />
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-label">Office</p>
          <strong>Academic office</strong>
          <span>Semester 1 • 2026</span>
        </div>
      </aside>

      <div className="ma-main">
        <header className="ma-topbar">
          <div>
            <p className="eyebrow">Management assistant</p>
            <h1>Operations dashboard</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">🔔</button>
            <div className="profile-pill">
              <div className="profile-avatar">MA</div>
              <div>
                <strong>Jane Silva</strong>
                <span>Academic Office</span>
              </div>
            </div>
          </div>
        </header>

        <main className="ma-content">
          <section className="welcome-card card">
            <div>
              <p className="eyebrow small">Good morning</p>
              <h2>Hello, Jane</h2>
              <p className="meta-line">Monday, 28 September 2026</p>
            </div>

            <div className="welcome-actions">
              <button type="button" className="primary-button">Create user</button>
              <button type="button" className="secondary-button">Enter grades</button>
            </div>
          </section>

          <section className="summary-grid" aria-label="Management summary metrics">
            {summaryCards.map((card) => (
              <article key={card.label} className="card metric-card">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.context}</span>
              </article>
            ))}
          </section>

          <section className="ma-grid">
            <article className="card queue-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow small">Priority queue</p>
                  <h3>Work queue</h3>
                </div>
                <button type="button" className="link-button">View all</button>
              </div>

              <div className="queue-list">
                {workQueue.map((item) => (
                  <div key={item.title} className="queue-item">
                    <span className="queue-dot" aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card activity-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow small">Recent activity</p>
                  <h3>Audit trail</h3>
                </div>
              </div>

              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div key={`${item.action}-${item.time}`} className="activity-item">
                    <div className="activity-icon" aria-hidden="true">•</div>
                    <div>
                      <strong>{item.action}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <span>{item.time}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
