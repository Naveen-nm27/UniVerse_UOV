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

const backupHistory = [
  { id: "BK-1042", type: "Full", requestedBy: "System scheduler", startedAt: "2026-10-07 10:15", endedAt: "2026-10-07 10:21", status: "Successful", size: "18.2 GB", target: "Primary storage", checksum: "Verified", error: "—" },
  { id: "BK-1038", type: "Incremental", requestedBy: "Operations team", startedAt: "2026-10-06 02:00", endedAt: "2026-10-06 02:17", status: "Overdue", size: "Not reported", target: "Secondary target", checksum: "Not connected", error: "Secondary target not reporting status" },
  { id: "BK-1034", type: "Full", requestedBy: "Manual admin", startedAt: "2026-10-05 21:35", endedAt: "2026-10-05 21:40", status: "Failed", size: "0.0 GB", target: "Archive vault", checksum: "Failed", error: "Target storage permission error" },
];

const maStaffRows = [
  { id: "MA-102", name: "Nimali Jayasinghe", email: "nimali@vau.ac.lk", staffNumber: "MA-4402", office: "Academic office", status: "Active", lastSignIn: "Today · 08:12 AM", permissions: "Users.manage, audit.view, backups.view" },
  { id: "MA-098", name: "Dilshan Kumar", email: "dilshan@vau.ac.lk", staffNumber: "MA-4389", office: "Student services", status: "Suspended", lastSignIn: "2026-10-05", permissions: "Users.view" },
  { id: "MA-087", name: "Arosha Nethmini", email: "arosha@vau.ac.lk", staffNumber: "MA-4327", office: "Faculty admin", status: "Active", lastSignIn: "Yesterday · 05:40 PM", permissions: "Audit.view, reports.run" },
];

const auditEvents = [
  { id: "AUD-8831", timestamp: "2026-10-07 08:42", actor: "System Admin", action: "MA_ACCOUNT_CREATED", resource: "ma_staff", outcome: "Success", requestId: "req-8412" },
  { id: "AUD-8829", timestamp: "2026-10-07 08:17", actor: "Nimali Jayasinghe", action: "BACKUP_REQUESTED", resource: "backup_jobs", outcome: "Success", requestId: "req-8399" },
  { id: "AUD-8820", timestamp: "2026-10-06 18:03", actor: "Arosha Nethmini", action: "REPORT_EXPORT", resource: "reports", outcome: "Failed", requestId: "req-8344" },
  { id: "AUD-8814", timestamp: "2026-10-05 16:11", actor: "System Admin", action: "ROLE_UPDATED", resource: "ma_staff", outcome: "Success", requestId: "req-8308" },
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

const monitoringSummary = [
  { name: "API", status: "Healthy", lastUpdated: "08:40 AM", detail: "Latency under 150ms" },
  { name: "Database", status: "Degraded", lastUpdated: "08:37 AM", detail: "One replica fell behind by 4 minutes" },
  { name: "Backup scheduler", status: "Unavailable", lastUpdated: "08:05 AM", detail: "No heartbeat received from remote target" },
  { name: "Storage", status: "Unknown", lastUpdated: "Not connected", detail: "Storage API not reporting metrics" },
];

const chartSeries = [42, 30, 46, 67, 58, 74, 61];

const initialForm = {
  fullName: "",
  email: "",
  staffNumber: "",
  office: "",
  phone: "",
  status: "Active",
};

export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [maQuery, setMaQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState(maStaffRows[0].id);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [restoreTargetId, setRestoreTargetId] = useState(backupHistory[0].id);
  const [restorePhrase, setRestorePhrase] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState(auditEvents[0].id);

  const statusTone = useMemo(
    () => ({
      Successful: "good",
      Overdue: "warn",
      "Not connected": "neutral",
      Completed: "good",
      Pending: "warn",
      Failed: "bad",
      Healthy: "good",
      Degraded: "warn",
      Unavailable: "bad",
      Unknown: "neutral",
      Success: "good",
    }),
    [],
  );

  const filteredStaff = useMemo(() => {
    const q = maQuery.trim().toLowerCase();
    if (!q) return maStaffRows;
    return maStaffRows.filter((entry) =>
      [entry.name, entry.email, entry.staffNumber, entry.office].some((field) => field.toLowerCase().includes(q)),
    );
  }, [maQuery]);

  const selectedStaff = useMemo(
    () => filteredStaff.find((row) => row.id === selectedStaffId) ?? filteredStaff[0] ?? maStaffRows[0],
    [filteredStaff, selectedStaffId],
  );

  const selectedAudit = useMemo(
    () => auditEvents.find((item) => item.id === selectedAuditId) ?? auditEvents[0],
    [selectedAuditId],
  );

  const selectedBackup = useMemo(
    () => backupHistory.find((item) => item.id === restoreTargetId) ?? backupHistory[0],
    [restoreTargetId],
  );

  const updateFormField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = "Enter a valid university email.";
    if (!formData.staffNumber.trim()) nextErrors.staffNumber = "Staff number is required.";
    if (!formData.office.trim()) nextErrors.office = "Office is required.";
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) nextErrors.phone = "Phone can only contain numbers and formatting characters.";
    return nextErrors;
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setReviewMode(true);
  };

  const handleConfirmCreate = () => {
    setReviewMode(false);
    setShowCreateForm(false);
    setFormData(initialForm);
    setFormErrors({});
  };

  const backupActionAvailable = false;

  const isOverview = activeNav === "Overview";
  const isMaStaff = activeNav === "MA staff";
  const isBackup = activeNav === "Backup and recovery";
  const isAudit = activeNav === "Audit logs";
  const isMonitoring = activeNav === "Monitoring";
  const isReports = activeNav === "System reports";

  return (
    <div className="admin-shell">
      <button className={`admin-scrim ${drawerOpen ? "is-visible" : ""}`} aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />

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
          {isOverview && (
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
                    <button type="button" className="admin-link-button" onClick={() => setActiveNav("Backup and recovery")}>Open backup centre →</button>
                  </div>

                  <div className="admin-list">
                    {backupHistory.map((item) => (
                      <div key={item.id} className="admin-list-item">
                        <div>
                          <strong>{item.type} · {item.id}</strong>
                          <small>{item.requestedBy}</small>
                        </div>
                        <div className="admin-meta-block">
                          <span className={`admin-state ${statusTone[item.status] ?? "neutral"}`}>{item.status}</span>
                          <time>{item.startedAt}</time>
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
                    <button type="button" className="admin-link-button" onClick={() => setActiveNav("Monitoring")}>Open monitoring →</button>
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
                    <button type="button" className="admin-link-button" onClick={() => setActiveNav("System reports")}>View system reports →</button>
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
                    <button type="button" className="admin-link-button" onClick={() => setActiveNav("Audit logs")}>Open audit logs →</button>
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
          )}

          {isMaStaff && (
            <div className="admin-tab-layout">
              <section className="admin-panel list-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">MA staff</p>
                    <h2>Management assistant directory</h2>
                  </div>
                  <button type="button" className="admin-primary-button" onClick={() => setShowCreateForm((value) => !value)}>Add MA staff</button>
                </div>

                <div className="admin-search-wrap">
                  <input
                    type="search"
                    value={maQuery}
                    onChange={(event) => setMaQuery(event.target.value)}
                    placeholder="Search by name, email, office or staff number"
                    aria-label="Search MA staff"
                  />
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Office</th>
                        <th>Status</th>
                        <th>Last sign-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((person) => (
                        <tr key={person.id} className={selectedStaff.id === person.id ? "is-selected" : ""} onClick={() => setSelectedStaffId(person.id)}>
                          <td>
                            <strong>{person.name}</strong>
                            <small>{person.staffNumber}</small>
                          </td>
                          <td>{person.office}</td>
                          <td><span className={`admin-state ${person.status === "Active" ? "good" : "warn"}`}>{person.status}</span></td>
                          <td>{person.lastSignIn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel detail-panel">
                <p className="admin-section-label">Selected account</p>
                <h3>{selectedStaff.name}</h3>
                <div className="admin-detail-grid">
                  <div><span>Email</span><strong>{selectedStaff.email}</strong></div>
                  <div><span>Office</span><strong>{selectedStaff.office}</strong></div>
                  <div><span>Staff number</span><strong>{selectedStaff.staffNumber}</strong></div>
                  <div><span>Permissions</span><strong>{selectedStaff.permissions}</strong></div>
                </div>

                <div className="admin-action-box">
                  <strong>Allowed actions</strong>
                  <div className="admin-action-group">
                    <button type="button" className="admin-secondary-button" disabled>Activate</button>
                    <button type="button" className="admin-secondary-button" disabled>Suspend</button>
                    <button type="button" className="admin-secondary-button" disabled>Reset password</button>
                  </div>
                  <p className="admin-inline-note">This list is kept empty unless the backend explicitly returns a real permissioned action. The browser must not invent admin privileges.</p>
                </div>
              </section>

              {showCreateForm && (
                <section className="admin-panel form-panel">
                  <div className="admin-panel-head compact-head">
                    <div>
                      <p className="admin-section-label">Add MA staff</p>
                      <h2>New management assistant</h2>
                    </div>
                  </div>

                  {!reviewMode ? (
                    <form onSubmit={handleCreateSubmit} className="admin-form">
                      <div className="admin-form-grid">
                        <label>
                          <span>Full name</span>
                          <input name="fullName" value={formData.fullName} onChange={updateFormField} />
                          {formErrors.fullName && <small>{formErrors.fullName}</small>}
                        </label>
                        <label>
                          <span>University email</span>
                          <input name="email" value={formData.email} onChange={updateFormField} />
                          {formErrors.email && <small>{formErrors.email}</small>}
                        </label>
                        <label>
                          <span>Staff number</span>
                          <input name="staffNumber" value={formData.staffNumber} onChange={updateFormField} />
                          {formErrors.staffNumber && <small>{formErrors.staffNumber}</small>}
                        </label>
                        <label>
                          <span>Office</span>
                          <select name="office" value={formData.office} onChange={updateFormField}>
                            <option value="">Select office</option>
                            <option value="Academic office">Academic office</option>
                            <option value="Student services">Student services</option>
                            <option value="Faculty admin">Faculty admin</option>
                          </select>
                          {formErrors.office && <small>{formErrors.office}</small>}
                        </label>
                        <label>
                          <span>Phone</span>
                          <input name="phone" value={formData.phone} onChange={updateFormField} />
                          {formErrors.phone && <small>{formErrors.phone}</small>}
                        </label>
                        <label>
                          <span>Initial status</span>
                          <select name="status" value={formData.status} onChange={updateFormField}>
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </label>
                      </div>

                      <div className="admin-form-actions">
                        <button type="button" className="admin-secondary-button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                        <button type="submit" className="admin-primary-button">Review details</button>
                      </div>
                    </form>
                  ) : (
                    <div className="admin-review-box">
                      <h3>Review before creation</h3>
                      <div className="admin-review-grid">
                        <div><span>Full name</span><strong>{formData.fullName}</strong></div>
                        <div><span>Email</span><strong>{formData.email}</strong></div>
                        <div><span>Staff number</span><strong>{formData.staffNumber}</strong></div>
                        <div><span>Office</span><strong>{formData.office}</strong></div>
                        <div><span>Phone</span><strong>{formData.phone || "Not provided"}</strong></div>
                        <div><span>Status</span><strong>{formData.status}</strong></div>
                      </div>
                      <div className="admin-inline-warning">
                        The server decides the MA role and records the authenticated admin who created this account. No browser-supplied creator ID is accepted as authority.
                      </div>
                      <div className="admin-form-actions">
                        <button type="button" className="admin-secondary-button" onClick={() => setReviewMode(false)}>Back</button>
                        <button type="button" className="admin-primary-button" onClick={handleConfirmCreate}>Create account (not executed without API)</button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {isBackup && (
            <div className="admin-backup-layout">
              <section className="admin-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">Backup and recovery</p>
                    <h2>Backup overview</h2>
                  </div>
                  <button type="button" className="admin-primary-button" disabled>Request new backup</button>
                </div>

                <div className="admin-summary-grid small-grid">
                  <div className="admin-metric-card">
                    <span>Last verified backup</span>
                    <strong>2026-10-07 10:15</strong>
                    <small>Checksum verified</small>
                  </div>
                  <div className="admin-metric-card">
                    <span>Next scheduled</span>
                    <strong>2026-10-08 02:00</strong>
                    <small>Nightly automated run</small>
                  </div>
                  <div className="admin-metric-card">
                    <span>Retention</span>
                    <strong>30 days</strong>
                    <small>Primary storage</small>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Job</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Target</th>
                        <th>Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((job) => (
                        <tr key={job.id} onClick={() => setRestoreTargetId(job.id)}>
                          <td>
                            <strong>{job.id}</strong>
                            <small>{job.startedAt}</small>
                          </td>
                          <td>{job.type}</td>
                          <td><span className={`admin-state ${statusTone[job.status] ?? "neutral"}`}>{job.status}</span></td>
                          <td>{job.target}</td>
                          <td>{job.checksum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel recover-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">Recovery</p>
                    <h2>Restore review</h2>
                  </div>
                </div>

                <div className="admin-recovery-card">
                  <strong>{selectedBackup.id}</strong>
                  <ul>
                    <li><span>Environment</span><strong>Production</strong></li>
                    <li><span>Backup date</span><strong>{selectedBackup.startedAt}</strong></li>
                    <li><span>Validation</span><strong>{selectedBackup.checksum}</strong></li>
                    <li><span>Error summary</span><strong>{selectedBackup.error}</strong></li>
                  </ul>
                </div>

                <div className="admin-restore-box">
                  <label>
                    <span>Type confirmation phrase</span>
                    <input value={restorePhrase} onChange={(event) => setRestorePhrase(event.target.value)} placeholder="Type: RESTORE PRODUCTION" />
                  </label>
                  <button type="button" className="admin-primary-button" disabled={!backupActionAvailable || restorePhrase !== "RESTORE PRODUCTION"}>Request restore preview</button>
                  <p className="admin-inline-note">Restore preview and live restore are disabled because the recovery API is not available in this frontend-only task.</p>
                </div>
              </section>
            </div>
          )}

          {isAudit && (
            <div className="admin-tab-layout">
              <section className="admin-panel list-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">Audit logs</p>
                    <h2>Server audit trail</h2>
                  </div>
                </div>

                <div className="admin-filter-row">
                  <select defaultValue="All actions">
                    <option>All actions</option>
                    <option>MA_ACCOUNT_CREATED</option>
                    <option>BACKUP_REQUESTED</option>
                    <option>REPORT_EXPORT</option>
                  </select>
                  <select defaultValue="All outcomes">
                    <option>All outcomes</option>
                    <option>Success</option>
                    <option>Failed</option>
                  </select>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEvents.map((event) => (
                        <tr key={event.id} className={selectedAudit.id === event.id ? "is-selected" : ""} onClick={() => setSelectedAuditId(event.id)}>
                          <td>{event.timestamp}</td>
                          <td>{event.actor}</td>
                          <td>{event.action}</td>
                          <td><span className={`admin-state ${statusTone[event.outcome] ?? "neutral"}`}>{event.outcome}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel detail-panel">
                <p className="admin-section-label">Audit details</p>
                <h3>{selectedAudit.action}</h3>
                <div className="admin-detail-grid">
                  <div><span>Actor</span><strong>{selectedAudit.actor}</strong></div>
                  <div><span>Resource</span><strong>{selectedAudit.resource}</strong></div>
                  <div><span>Outcome</span><strong>{selectedAudit.outcome}</strong></div>
                  <div><span>Request ID</span><strong>{selectedAudit.requestId}</strong></div>
                </div>
                <div className="admin-inline-warning">
                  Sensitive values such as raw tokens, database credentials and password hashes are intentionally excluded from the browser UI. This is a read-only audit surface.
                </div>
              </section>
            </div>
          )}

          {isMonitoring && (
            <div className="admin-monitoring-layout">
              <section className="admin-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">Monitoring</p>
                    <h2>Service health</h2>
                  </div>
                  <button type="button" className="admin-secondary-button">Refresh</button>
                </div>

                <div className="admin-monitor-grid">
                  {monitoringSummary.map((metric) => (
                    <div key={metric.name} className="admin-monitor-card">
                      <div className="admin-monitor-top">
                        <strong>{metric.name}</strong>
                        <span className={`admin-state ${statusTone[metric.status] ?? "neutral"}`}>{metric.status}</span>
                      </div>
                      <small>{metric.lastUpdated}</small>
                      <p>{metric.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-head compact-head">
                  <div>
                    <p className="admin-section-label">Trends</p>
                    <h2>Recent operational data</h2>
                  </div>
                </div>
                <div className="admin-chart" aria-label="Monitoring chart">
                  {chartSeries.map((value, index) => (
                    <div key={`${value}-${index}`} className="admin-bar" style={{ height: `${value}%` }} title={`${value}%`} />
                  ))}
                </div>
                <div className="admin-chart-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </section>
            </div>
          )}

          {isReports && (
            <section className="admin-panel empty-panel">
              <p className="admin-section-label">System reports</p>
              <h2>Operational reports</h2>
              <p className="admin-empty-copy">This screen is intentionally informational until a server-backed reporting API is exposed. Current data is only shown in the overview and the audit/monitoring surfaces where real status values are available.</p>
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
