import { clearStoredSession } from "../../../auth/session";

const navItems = [
  { label: "Overview", href: "/lecturer" },
  { label: "Modules", href: "/lecturer/modules" },
  { label: "Timetable", href: "/lecturer/timetable" },
  { label: "Sessions", href: "/lecturer/sessions" },
  { label: "Assessments", href: "/lecturer/assessments" },
  { label: "Results", href: "/lecturer/results" },
  { label: "Profile", href: "/lecturer/profile" },
];

function normalizeActivePath(path) {
  if (!path || path === "/lecturer") return "/lecturer";
  return path.startsWith("/lecturer") ? path : "/lecturer";
}

export default function LecturerShell({ profile, activePath, semesterId, onSemesterChange, children }) {
  const active = normalizeActivePath(activePath);
  const initials = (profile?.fullName || "Lecturer")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    clearStoredSession();
    window.location.assign("/");
  }

  return (
    <div className="lecturer-dashboard">
      <aside className="lecturer-sidebar" aria-label="Lecturer navigation">
        <div className="lecturer-brand-wrap">
          <a className="sidebar-brand" href="/lecturer"><span className="brand-icon">U</span><span>UniVerse</span></a>
          <p className="lecturer-role">Lecturer workspace</p>
        </div>

        <nav className="lecturer-nav" aria-label="Lecturer primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={active === item.href ? "lecturer-nav-item active" : "lecturer-nav-item"}
              href={item.href}
              aria-current={active === item.href ? "page" : undefined}
            >
              <span className="nav-bullet" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="lecturer-sidebar-card">
          <p className="sidebar-label">Academic term</p>
          <strong>{semesterId || "Current semester"}</strong>
          <span>Faculty of Computing</span>
        </div>
      </aside>

      <main className="lecturer-main">
        <header className="lecturer-topbar">
          <div>
            <p className="eyebrow">University workspace</p>
            <h1>Lecturer dashboard</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              🔔
            </button>
            <div className="profile-pill" aria-live="polite">
              <div className="profile-avatar">{initials}</div>
              <div>
                <strong>{profile?.fullName || "Lecturer"}</strong>
                <span>{profile?.department || "Academic staff"}</span>
              </div>
            </div>
            <button type="button" className="outline-button" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>

        <div className="lecturer-page">
          {children}
        </div>
      </main>
    </div>
  );
}
