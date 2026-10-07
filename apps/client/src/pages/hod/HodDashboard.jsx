import { useMemo, useState } from "react";
import "./HodDashboard.css";

const navItems = ["Overview", "Verify results", "Report approvals", "Verification history"];

const summaryCards = [
  { label: "Results awaiting review", value: "14", context: "This week", badge: "Pending" },
  { label: "Reports needing approval", value: "06", context: "Current cycle", badge: "Action" },
  { label: "Returned for correction", value: "03", context: "Last 7 days", badge: "Follow-up" },
  { label: "Decisions logged", value: "41", context: "This month", badge: "Recorded" },
];

const resultQueue = [
  {
    id: "R-2048",
    module: "CS201 Data Structures",
    batch: "2023/24 Batch B",
    programme: "BSc Computer Science",
    semester: "Semester 2",
    rows: 68,
    status: "Awaiting verification",
    updatedAt: "Today, 08:40",
    actor: "M. Dissanayake",
    type: "Result submission",
    allowedActions: ["Verify", "Return for correction"],
  },
  {
    id: "R-2040",
    module: "CS304 Database Systems",
    batch: "2022/23 Batch A",
    programme: "BSc Computer Science",
    semester: "Semester 1",
    rows: 55,
    status: "With HOD",
    updatedAt: "Yesterday, 16:15",
    actor: "Academic office",
    type: "Final results",
    allowedActions: ["Verify", "Reject"],
  },
  {
    id: "R-2019",
    module: "CS110 Programming I",
    batch: "2024/25 Batch A",
    programme: "BSc Computer Science",
    semester: "Semester 1",
    rows: 72,
    status: "Needs attention",
    updatedAt: "2 days ago",
    actor: "Faculty admin",
    type: "ICA review",
    allowedActions: ["Verify"],
  },
];

const reportQueue = [
  {
    id: "REP-118",
    title: "Departmental result review report",
    type: "Academic review",
    department: "Computer Science",
    submittedBy: "Exam unit",
    dueDate: "18 Oct 2026",
    status: "Pending approval",
    updatedAt: "Today, 09:10",
    allowedActions: ["Approve", "Reject"],
  },
  {
    id: "REP-109",
    title: "Student support outcome summary",
    type: "Wellbeing report",
    department: "Computer Science",
    submittedBy: "Student affairs",
    dueDate: "21 Oct 2026",
    status: "Awaiting HOD review",
    updatedAt: "Yesterday, 13:50",
    allowedActions: ["Approve", "Reject"],
  },
  {
    id: "REP-092",
    title: "Semester workload assessment",
    type: "Staff planning",
    department: "Computer Science",
    submittedBy: "Academic coordinator",
    dueDate: "22 Oct 2026",
    status: "Returned",
    updatedAt: "3 days ago",
    allowedActions: ["Approve"],
  },
];

const historyItems = [
  { id: "H-771", type: "Result review", title: "CS201 Data Structures", status: "Verified", actor: "Dr. A. Perera", note: "Missing grade row resolved", date: "2026-10-06 09:12" },
  { id: "H-770", type: "Report approval", title: "Departmental result review report", status: "Approved", actor: "Dr. A. Perera", note: "Submitted with full departmental review", date: "2026-10-05 15:40" },
  { id: "H-769", type: "Result review", title: "CS304 Database Systems", status: "Returned for correction", actor: "Dr. A. Perera", note: "Two duplicate attempts flagged", date: "2026-10-04 11:08" },
  { id: "H-768", type: "Report approval", title: "Semester workload assessment", status: "Rejected", actor: "Dr. A. Perera", note: "Insufficient supporting evidence", date: "2026-10-02 17:22" },
];

const recentDecisions = [
  { title: "CS201 Data Structures", detail: "Verified by HOD with 2 correction notes", time: "08:40" },
  { title: "Departmental result review report", detail: "Approved and sent back to the exam unit", time: "Yesterday" },
  { title: "CS304 Database Systems", detail: "Returned for correction due to duplicate attempts", time: "2 days ago" },
];

export default function HodDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedResultId, setSelectedResultId] = useState(resultQueue[0].id);
  const [selectedReportId, setSelectedReportId] = useState(reportQueue[0].id);

  const selectedResult = useMemo(
    () => resultQueue.find((item) => item.id === selectedResultId) ?? resultQueue[0],
    [selectedResultId],
  );

  const selectedReport = useMemo(
    () => reportQueue.find((item) => item.id === selectedReportId) ?? reportQueue[0],
    [selectedReportId],
  );

  const departmentName = "Computer Science";

  return (
    <div className="hod-shell">
      <button
        className={`hod-scrim ${drawerOpen ? "is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`hod-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Head of Department navigation">
        <div className="hod-brand-wrap">
          <div className="hod-brand">
            <span className="hod-brand-mark">U</span>
            <span>UniVerse</span>
          </div>
        </div>

        <div className="hod-role-tag">
          <span className="hod-role-dot" aria-hidden="true" />
          Head of Department
        </div>

        <nav className="hod-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`hod-nav-button ${activeTab === item ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab(item);
                setDrawerOpen(false);
              }}
            >
              <span className="hod-nav-icon" aria-hidden="true">{iconFor(item)}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="hod-sidebar-footer">
          <div className="hod-help-icon">?</div>
          <div>
            <strong>{departmentName}</strong>
            <span>Academic review</span>
          </div>
        </div>
      </aside>

      <div className="hod-main">
        <header className="hod-topbar">
          <button className="hod-menu-button" type="button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>
            ☰
          </button>

          <div className="hod-breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{activeTab}</strong>
          </div>

          <div className="hod-top-actions">
            <button className="hod-icon-button" type="button" aria-label="Notifications">
              <span className="hod-notification-dot" aria-hidden="true" />
              ♡
            </button>

            <div className="hod-profile">
              <span className="hod-avatar">AP</span>
              <div className="hod-profile-copy">
                <strong>Dr. A. Perera</strong>
                <small>Head of Department</small>
              </div>
              <span aria-hidden="true">⌄</span>
            </div>
          </div>
        </header>

        <main className="hod-content">
          {activeTab === "Overview" && (
            <>
              <section className="hod-panel intro-panel">
                <div>
                  <p className="hod-section-label">Department overview</p>
                  <h1>{departmentName}</h1>
                  <p className="hod-intro-copy">Last updated today at 08:40 AM. Review pending result decisions and authorisation reports assigned to your department.</p>
                </div>
                <div className="hod-badge-group">
                  <span className="hod-badge hod-badge-primary">Department review</span>
                  <span className="hod-badge">Active</span>
                </div>
              </section>

              <section className="hod-summary-grid" aria-label="Summary cards">
                {summaryCards.map((card, index) => (
                  <article key={card.label} className={`hod-summary-card delay-${index + 1}`}>
                    <div className="hod-card-head">
                      <span className="hod-card-mark">✓</span>
                      <span className="hod-card-badge">{card.badge}</span>
                    </div>
                    <strong>{card.value}</strong>
                    <span>{card.label}</span>
                    <small>{card.context}</small>
                  </article>
                ))}
              </section>

              <div className="hod-two-column">
                <section className="hod-panel">
                  <div className="hod-panel-head">
                    <div>
                      <p className="hod-section-label">Result queue</p>
                      <h2>Results awaiting HOD verification</h2>
                    </div>
                    <button type="button" className="hod-link-button" onClick={() => setActiveTab("Verify results")}>
                      View all →
                    </button>
                  </div>

                  <div className="hod-queue-list">
                    {resultQueue.map((item) => (
                      <button key={item.id} type="button" className="hod-queue-item" onClick={() => setSelectedResultId(item.id)}>
                        <span className="hod-queue-pill hod-pill-plum">{item.type}</span>
                        <div>
                          <strong>{item.module}</strong>
                          <small>{item.batch} · {item.semester}</small>
                        </div>
                        <span className="hod-item-status">{item.status}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="hod-panel">
                  <div className="hod-panel-head">
                    <div>
                      <p className="hod-section-label">Reports</p>
                      <h2>Reports pending approval</h2>
                    </div>
                    <button type="button" className="hod-link-button" onClick={() => setActiveTab("Report approvals")}>
                      View all →
                    </button>
                  </div>

                  <div className="hod-queue-list">
                    {reportQueue.map((item) => (
                      <button key={item.id} type="button" className="hod-queue-item" onClick={() => setSelectedReportId(item.id)}>
                        <span className="hod-queue-pill hod-pill-pink">{item.type}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.submittedBy} · Due {item.dueDate}</small>
                        </div>
                        <span className="hod-item-status">{item.status}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section className="hod-panel full-panel">
                <div className="hod-panel-head">
                  <div>
                    <p className="hod-section-label">Recent decisions</p>
                    <h2>Recent HOD activity</h2>
                  </div>
                  <button type="button" className="hod-link-button" onClick={() => setActiveTab("Verification history")}>
                    View history →
                  </button>
                </div>

                <div className="hod-recent-list">
                  {recentDecisions.map((item) => (
                    <div key={item.title} className="hod-recent-item">
                      <span className="hod-tiny-tag">Decision</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                      <time>{item.time}</time>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "Verify results" && (
            <div className="hod-tab-layout">
              <section className="hod-panel list-panel">
                <div className="hod-panel-head compact-head">
                  <div>
                    <p className="hod-section-label">Result verification</p>
                    <h2>Submission queue</h2>
                  </div>
                  <div className="hod-filter-row">
                    <button type="button" className="hod-filter-chip is-active">All</button>
                    <button type="button" className="hod-filter-chip">Pending</button>
                  </div>
                </div>

                <div className="hod-table-wrap">
                  <table className="hod-table">
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Batch</th>
                        <th>Rows</th>
                        <th>Status</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultQueue.map((item) => (
                        <tr key={item.id} className={selectedResult.id === item.id ? "is-selected" : ""} onClick={() => setSelectedResultId(item.id)}>
                          <td>
                            <strong>{item.module}</strong>
                            <small>{item.id}</small>
                          </td>
                          <td>{item.batch}</td>
                          <td>{item.rows}</td>
                          <td><span className="hod-status-badge">{item.status}</span></td>
                          <td>{item.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="hod-panel detail-panel">
                <p className="hod-section-label">Selected submission</p>
                <h3>{selectedResult.module}</h3>
                <div className="hod-detail-grid">
                  <div><span>Programme</span><strong>{selectedResult.programme}</strong></div>
                  <div><span>Semester</span><strong>{selectedResult.semester}</strong></div>
                  <div><span>Current status</span><strong>{selectedResult.status}</strong></div>
                  <div><span>Latest actor</span><strong>{selectedResult.actor}</strong></div>
                </div>

                <div className="hod-checklist">
                  <span>Missing grade rows: 2</span>
                  <span>Duplicate attempts: 1</span>
                  <span>Result completeness: 94%</span>
                </div>

                <div className="hod-action-box">
                  <strong>Available actions</strong>
                  <div className="hod-action-group">
                    {selectedResult.allowedActions.map((action) => (
                      <button key={action} type="button" className="hod-primary-button">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Report approvals" && (
            <div className="hod-tab-layout">
              <section className="hod-panel list-panel">
                <div className="hod-panel-head compact-head">
                  <div>
                    <p className="hod-section-label">Report approvals</p>
                    <h2>Departmental reports</h2>
                  </div>
                  <div className="hod-filter-row">
                    <button type="button" className="hod-filter-chip is-active">Pending</button>
                    <button type="button" className="hod-filter-chip">Approved</button>
                  </div>
                </div>

                <div className="hod-table-wrap">
                  <table className="hod-table">
                    <thead>
                      <tr>
                        <th>Report</th>
                        <th>Submitted by</th>
                        <th>Status</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportQueue.map((item) => (
                        <tr key={item.id} className={selectedReport.id === item.id ? "is-selected" : ""} onClick={() => setSelectedReportId(item.id)}>
                          <td>
                            <strong>{item.title}</strong>
                            <small>{item.id}</small>
                          </td>
                          <td>{item.submittedBy}</td>
                          <td><span className="hod-status-badge hod-status-alt">{item.status}</span></td>
                          <td>{item.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="hod-panel detail-panel">
                <p className="hod-section-label">Selected report</p>
                <h3>{selectedReport.title}</h3>
                <div className="hod-detail-grid">
                  <div><span>Type</span><strong>{selectedReport.type}</strong></div>
                  <div><span>Department</span><strong>{selectedReport.department}</strong></div>
                  <div><span>Submitted by</span><strong>{selectedReport.submittedBy}</strong></div>
                  <div><span>Due date</span><strong>{selectedReport.dueDate}</strong></div>
                </div>

                <div className="hod-report-preview">
                  <p>Supporting summary</p>
                  <ul>
                    <li>Supporting records attached and reviewed.</li>
                    <li>Departmental scope matches HOD assignment.</li>
                    <li>Decision requires approval note before submission.</li>
                  </ul>
                </div>

                <div className="hod-action-box">
                  <strong>Available actions</strong>
                  <div className="hod-action-group">
                    {selectedReport.allowedActions.map((action) => (
                      <button key={action} type="button" className="hod-primary-button hod-primary-alt">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Verification history" && (
            <section className="hod-panel history-panel">
              <div className="hod-panel-head compact-head">
                <div>
                  <p className="hod-section-label">Verification history</p>
                  <h2>Persisted departmental decisions</h2>
                </div>
                <div className="hod-filter-row">
                  <button type="button" className="hod-filter-chip is-active">All</button>
                  <button type="button" className="hod-filter-chip">Results</button>
                  <button type="button" className="hod-filter-chip">Reports</button>
                </div>
              </div>

              <div className="hod-table-wrap history-wrap">
                <table className="hod-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item type</th>
                      <th>Title</th>
                      <th>Actor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{item.type}</td>
                        <td>
                          <strong>{item.title}</strong>
                          <small>{item.note}</small>
                        </td>
                        <td>{item.actor}</td>
                        <td><span className="hod-status-badge">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    case "Verify results":
      return "✓";
    case "Report approvals":
      return "▣";
    case "Verification history":
      return "◷";
    default:
      return "•";
  }
}
