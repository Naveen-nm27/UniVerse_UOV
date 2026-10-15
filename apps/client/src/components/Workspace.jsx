import { useEffect, useRef, useState } from "react";
import { useMobile } from "../hooks/use-mobile";
import { getSession, signOut } from "../api/client";
import "../pages/ma/ManagementAssistantDashboard.css";
export default function Workspace({ title, navigation, children }) {
  const [open, setOpen] = useState(false),
    user = getSession()?.user;
  const mobile = useMobile(),
    sidebar = useRef(null),
    menu = useRef(null),
    wasOpen = useRef(false);
  useEffect(() => {
    if (mobile && open) sidebar.current?.querySelector("a")?.focus();
    if (wasOpen.current && !open) menu.current?.focus();
    wasOpen.current = open;
  }, [open, mobile]);
  const path = window.location.pathname.replace(/\/$/, "");
  const active = [...navigation]
    .reverse()
    .find(([, href]) => path === href || path.startsWith(href + "/"));
  useEffect(() => {
    if (!open) return;
    const key = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
  return (
    <div className="ma-shell">
      <button
        className={`ma-scrim ${open ? "is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={sidebar}
        inert={mobile && !open}
        className={`ma-sidebar ${open ? "is-open" : ""}`}
        aria-label={`${title} navigation`}
      >
        <div className="ma-brand">
          <span className="ma-brand-mark">U</span>UniVerse
        </div>
        <p className="ma-role">{title}</p>
        <nav className="ma-nav">
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={`ma-nav-link ${active?.[1] === href ? "is-active" : ""}`}
              aria-current={active?.[1] === href ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <button className="ma-signout" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <div className="ma-main" inert={mobile && open}>
        <header className="ma-topbar">
          <button
            ref={menu}
            className="ma-menu-button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <strong>{active?.[0] || title}</strong>
          <span className="ma-profile">{user?.fullName}</span>
        </header>
        <main className="ma-content">{children}</main>
      </div>
    </div>
  );
}
