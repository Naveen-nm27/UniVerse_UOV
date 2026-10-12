import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import "./AdminDashboard.css";

const pages = [
  { label: "Overview", href: "/admin" },
  { label: "MA staff", href: "/admin/ma-staff" },
  { label: "Backup and recovery", href: "/admin/backup" },
  { label: "Audit logs", href: "/admin/audit" },
  { label: "Monitoring", href: "/admin/monitoring" },
  { label: "System reports", href: "/admin/reports" },
];

const pageByPath = {
  "/admin": "Overview",
  "/admin/ma-staff": "MA staff",
  "/admin/backup": "Backup and recovery",
  "/admin/audit": "Audit logs",
  "/admin/monitoring": "Monitoring",
  "/admin/reports": "System reports",
};

export default function AdminDashboard({ session, navigate, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [healthState, setHealthState] = useState("idle");
  const [healthMessage, setHealthMessage] = useState("");
  const [healthCheckedAt, setHealthCheckedAt] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", staffNumber: "", position: "", officeNumber: "" });
  const [showReview, setShowReview] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const healthController = useRef(null);
  const isMounted = useRef(true);
  const menuButtonRef = useRef(null);
  const firstNavLinkRef = useRef(null);
  const currentPage = pageByPath[window.location.pathname] || "Overview";
  const displayName = session.user.fullName || "Administrator";

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      healthController.current?.abort();
    };
  }, []);
  useEffect(() => () => healthController.current?.abort(), [currentPage]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  function changePage(href) {
    healthController.current?.abort();
    healthController.current = null;
    setHealthState("idle");
    setHealthMessage("");
    setHealthCheckedAt("");
    navigate(href);
    setShowReview(false);
    setFormMessage("");
  }

  function goTo(event, href) {
    event.preventDefault();
    changePage(href);
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  function openDrawer() {
    setDrawerOpen(true);
    window.requestAnimationFrame(() => firstNavLinkRef.current?.focus());
  }

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  async function checkApiHealth() {
    healthController.current?.abort();
    const controller = new AbortController();
    healthController.current = controller;
    setHealthState("loading");
    setHealthMessage("");
    setHealthCheckedAt("");
    try {
      const result = await apiRequest("../health", { signal: controller.signal });
      setHealthState("success");
      setHealthCheckedAt(new Date().toISOString());
      setHealthMessage(result?.status === "ok"
        ? "The API is reachable. Administrative monitoring metrics are not provided by this endpoint."
        : "The health endpoint responded, but did not provide a recognized status.");
    } catch (error) {
      if (error.name === "AbortError") {
        if (isMounted.current) setHealthState("idle");
        return;
      }
      setHealthState("error");
      setHealthMessage(error.message);
    } finally {
      if (healthController.current === controller) healthController.current = null;
    }
  }

  function reviewAccount(event) {
    event.preventDefault();
    const values = Object.values(form).map((value) => value.trim());
    if (values.some((value) => !value)) {
      setFormMessage("Complete all fields before reviewing this draft.");
      return;
    }
    setForm((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, value.trim()])));
    setFormMessage("");
    setShowReview(true);
  }

  const pageContent = {
    Overview: <Overview navigate={changePage} />,
    "MA staff": (
      <MaStaffPage
        form={form}
        setForm={setForm}
        formMessage={formMessage}
        showReview={showReview}
        onReview={reviewAccount}
        onCancelReview={() => setShowReview(false)}
      />
    ),
    "Backup and recovery": <BackupPage />,
    "Audit logs": <AuditPage />,
    Monitoring: (
      <MonitoringPage
        healthState={healthState}
        healthMessage={healthMessage}
        healthCheckedAt={healthCheckedAt}
        onCheck={checkApiHealth}
      />
    ),
    "System reports": <ReportsPage />,
  };

  return (
    <div className="admin-shell">
      <button
        className={`admin-scrim ${drawerOpen ? "is-visible" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={closeDrawer}
      />
      <aside className={`admin-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Administrator navigation">
        <a className="admin-brand" href="/admin" onClick={(event) => goTo(event, "/admin")}>
          <span className="admin-brand-mark" aria-hidden="true">U</span>
          <span>UniVerse</span>
        </a>
        <div className="admin-role-tag"><span className="admin-role-dot" /> System administrator</div>
        <nav className="admin-nav" aria-label="Admin workspace">
          {pages.map((page, index) => (
            <a
              ref={index === 0 ? firstNavLinkRef : undefined}
              className={`admin-nav-link ${currentPage === page.label ? "is-active" : ""}`}
              href={page.href}
              aria-current={currentPage === page.label ? "page" : undefined}
              key={page.label}
              onClick={(event) => goTo(event, page.href)}
            >
              <span className="admin-nav-icon" aria-hidden="true">{iconFor(page.label)}</span>
              <span>{page.label}</span>
            </a>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-help-icon" aria-hidden="true">i</span>
          <div><strong>Protected workspace</strong><span>Admin access</span></div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={openDrawer}
          >☰</button>
          <div className="admin-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{currentPage}</strong></div>
          <div className="admin-profile">
            <span className="admin-avatar" aria-hidden="true">{initials(displayName)}</span>
            <span className="admin-profile-copy"><strong>{displayName}</strong><small>System administrator</small></span>
            <button className="admin-logout" type="button" onClick={onLogout}>Sign out</button>
          </div>
        </header>

        <main className="admin-content">
          {pageContent[currentPage] || pageContent.Overview}
        </main>
      </div>
    </div>
  );
}

function Overview({ navigate }) {
  return (
    <>
      <section className="admin-intro">
        <p className="admin-eyebrow">Admin workspace</p>
        <h1>Administrator overview</h1>
        <p>Operational data will appear here when the server exposes approved, permission-checked admin APIs. No sample or estimated values are shown.</p>
      </section>
      <section className="admin-overview-grid" aria-label="Admin areas">
        {pages.slice(1).map((page) => (
          <a className="admin-area-card" href={page.href} key={page.href} onClick={(event) => {
            event.preventDefault();
            navigate(page.href);
          }}>
            <span className="admin-card-icon" aria-hidden="true">{iconFor(page.label)}</span>
            <h2>{page.label}</h2>
            <p>{descriptionFor(page.label)}</p>
            <span className="admin-card-status">Unavailable · server API not exposed</span>
          </a>
        ))}
      </section>
      <UnavailableNotice title="Live overview and server authorization are unavailable">
        The current server has no Admin overview endpoint or authorization middleware for Admin operations. Counts, alerts, recent activity and job totals are not calculated in the browser; every future operation must be authorized by the server.
      </UnavailableNotice>
    </>
  );
}

function MaStaffPage({ form, setForm, formMessage, showReview, onReview, onCancelReview }) {
  return (
    <>
      <PageHeading eyebrow="People and access" title="Management Assistant staff" description="Directory and account-creation tools require server-backed staff and user records." />
      <UnavailableNotice title="Staff directory is unavailable">
        No authenticated MA directory or account-creation endpoint is exposed. The existing login and user schema do not provide an MA creation contract.
      </UnavailableNotice>
      <section className="admin-panel" aria-labelledby="ma-create-title">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">Account setup</p><h2 id="ma-create-title">Prepare an MA account request</h2></div>
          <span className="admin-status admin-status-unavailable">Creation unavailable</span>
        </div>
        {showReview ? (
          <div className="admin-review">
            <h3>Review draft</h3>
            <p>This is a local preview only. It has not been submitted or saved.</p>
            <dl className="admin-review-grid">
              {Object.entries({ "Full name": form.fullName, Email: form.email, "Staff number": form.staffNumber, Position: form.position, "Office number": form.officeNumber }).map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <div className="admin-actions">
              <button type="button" className="admin-button admin-button-secondary" onClick={onCancelReview}>Edit draft</button>
              <button type="button" className="admin-button" disabled aria-describedby="ma-create-unavailable">Create account</button>
            </div>
            <p id="ma-create-unavailable" className="admin-help-text">Unavailable: the server must provide an authorized MA creation endpoint with duplicate handling and server-derived actor identity.</p>
          </div>
        ) : (
          <form className="admin-form" onSubmit={onReview}>
            <div className="admin-form-grid">
              <FormField label="Full name" name="fullName" value={form.fullName} onChange={setForm} autoComplete="name" />
              <FormField label="University email" name="email" value={form.email} onChange={setForm} type="email" autoComplete="email" />
              <FormField label="Staff number" name="staffNumber" value={form.staffNumber} onChange={setForm} />
              <FormField label="Position" name="position" value={form.position} onChange={setForm} />
              <FormField label="Office number" name="officeNumber" value={form.officeNumber} onChange={setForm} />
            </div>
            {formMessage && <p className="admin-form-message" role="alert">{formMessage}</p>}
            <div className="admin-actions">
              <button className="admin-button admin-button-secondary" type="reset" onClick={() => {
                setForm({ fullName: "", email: "", staffNumber: "", position: "", officeNumber: "" });
              }}>Clear</button>
              <button className="admin-button" type="submit">Review draft</button>
            </div>
            <p className="admin-help-text">Review only prepares a local preview. No account, password or email is created or sent.</p>
          </form>
        )}
      </section>
    </>
  );
}

function BackupPage() {
  return (
    <>
      <PageHeading eyebrow="Resilience" title="Backup and recovery" description="Backup history, job state and restore operations must come from the server." />
      <UnavailableNotice title="Backup and recovery APIs are unavailable">
        The backend exposes no backup catalogue, creation, job-status, retention/download or restore-preview/restore endpoint. No backup is assumed to exist, and no restore can be initiated here.
      </UnavailableNotice>
      <section className="admin-panel">
        <h2>Required before enabling backup actions</h2>
        <ul className="admin-contract-list">
          <li>Authenticated backup history and detail responses with redacted summaries.</li>
          <li>Backup request endpoint returning a job ID and queued/running/completed/failed states.</li>
          <li>Protected artifact download URL or authenticated download response with expiry.</li>
          <li>Restore preview and separately confirmed restore endpoints, including asynchronous job status.</li>
        </ul>
        <p className="admin-help-text">Create and restore actions remain unavailable until these contracts exist. No secrets or backup contents are displayed.</p>
      </section>
    </>
  );
}

function AuditPage() {
  return (
    <>
      <PageHeading eyebrow="Governance" title="Audit logs" description="Only server-provided redacted audit summaries should be shown." />
      <UnavailableNotice title="Audit log API is unavailable">
        The backend does not expose an authenticated audit search endpoint, supported filters, pagination or a redacted event schema. No audit events or payload details are fabricated.
      </UnavailableNotice>
      <section className="admin-panel">
        <h2>Required audit contract</h2>
        <p className="admin-copy">A server-side paginated event list with supported date/action/outcome filters, stable cursors, redacted fields and authorization enforcement is needed before this table can be populated.</p>
      </section>
    </>
  );
}

function MonitoringPage({ healthState, healthMessage, healthCheckedAt, onCheck }) {
  return (
    <>
      <PageHeading eyebrow="Service status" title="Monitoring" description="Health indicators must be timestamped and reflect server-reported data." />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">API liveness</p><h2>Basic health endpoint</h2></div>
          <button className="admin-button admin-button-secondary" type="button" onClick={onCheck} disabled={healthState === "loading"}>
            {healthState === "loading" ? "Checking…" : "Check API"}
          </button>
        </div>
        {healthState === "idle" && <p className="admin-copy">The server exposes a basic <code>/health</code> check. Select “Check API” to request its current response.</p>}
        {healthState === "success" && <p className="admin-result" role="status">{healthMessage}</p>}
        {healthState === "success" && healthCheckedAt && <p className="admin-help-text">Checked from this browser at <time dateTime={healthCheckedAt}>{new Date(healthCheckedAt).toLocaleString()}</time>.</p>}
        {healthState === "error" && <p className="admin-form-message" role="alert">{healthMessage} You can retry the check.</p>}
      </section>
      <UnavailableNotice title="Detailed monitoring is unavailable">
        No authenticated metrics, alert history, timestamps or trend-series endpoints are exposed. The basic liveness response is not a substitute for service health, backup state or system statistics.
      </UnavailableNotice>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageHeading eyebrow="Reporting" title="System reports" description="Generate only reports explicitly approved and supported by the backend." />
      <UnavailableNotice title="No report catalogue or generation API is available">
        The backend does not provide a report catalogue, report submission endpoint, job-status response, aggregate preview or protected download. Therefore no report types or filter options are offered.
      </UnavailableNotice>
      <section className="admin-panel">
        <h2>Report availability</h2>
        <p className="admin-copy">There are currently no report types that this client can confirm are supported. The UI will list each report’s contents and personal-information classification only when those details are provided by the server. CSV/PDF exports, academic statistics and sample jobs are not generated here.</p>
        <p className="admin-help-text">Required contract: approved catalogue and filter schema; submit response with job ID; queued/running/completed/failed state, requester, period, generation time and expiry; optional server-provided aggregate preview; protected download response or authenticated URL.</p>
      </section>
    </>
  );
}

function PageHeading({ eyebrow, title, description }) {
  return (
    <section className="admin-intro">
      <p className="admin-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function UnavailableNotice({ title, children }) {
  return (
    <section className="admin-unavailable" role="status">
      <span className="admin-unavailable-icon" aria-hidden="true">!</span>
      <div><h2>{title}</h2><p>{children}</p></div>
    </section>
  );
}

function FormField({ label, name, value, onChange, ...inputProps }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input name={name} value={value} onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))} required {...inputProps} />
    </label>
  );
}

function descriptionFor(page) {
  return {
    "MA staff": "Directory and account provisioning",
    "Backup and recovery": "Backup jobs, retention and restore",
    "Audit logs": "Redacted administrative activity",
    Monitoring: "Server health and operational metrics",
    "System reports": "Approved report catalogue and jobs",
  }[page];
}

function iconFor(label) {
  return {
    Overview: "⌂",
    "MA staff": "＋",
    "Backup and recovery": "▣",
    "Audit logs": "◷",
    Monitoring: "⌁",
    "System reports": "▤",
  }[label];
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
