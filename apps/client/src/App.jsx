import { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import ManagementAssistantDashboard from "./pages/ma/ManagementAssistantDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import { apiRequest, getSession, signOut, updateSessionUser } from "./api/client";
import { changePassword } from "./api/users";
import "./App.css";
export default function App() {
  const path = window.location.pathname;
  const [session, setSession] = useState(getSession);
  const [ready, setReady] = useState(path === "/" || !session?.token);
  const [sessionError, setSessionError] = useState("");
  const [retry, setRetry] = useState(0);
  const token = session?.token;
  useEffect(() => {
    if (path === "/" || !token) return;
    const controller = new AbortController();
    apiRequest("/users/me", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) {
        updateSessionUser(data); setSession((current) => ({ ...current, user: data })); setSessionError(""); setReady(true);
      }
    }).catch((error) => { if (!controller.signal.aborted) setSessionError(error.message); });
    return () => controller.abort();
  }, [path, token, retry]);
  if (path === "/") return <LoginForm />;
  if (!session?.token) { window.location.replace("/"); return null; }
  if (!ready) return <main className="login-panel">{sessionError ? <div role="alert"><p>{sessionError}</p><button onClick={() => setRetry((value) => value + 1)}>Try again</button><button onClick={signOut}>Sign out</button></div> : <p role="status">Opening your workspace…</p>}</main>;
  const role = session.user?.role;
  if (session.user?.mustChangePassword) return <ChangePassword user={session.user} />;
  if (/^\/ma(?:\/|$)/.test(path) && role === "MA") return <ManagementAssistantDashboard />;
  if (/^\/student(?:\/|$)/.test(path) && role === "STUDENT") return <StudentDashboard />;
  return <main className="login-panel"><h1>Workspace unavailable</h1><p>This page is unavailable for your account.</p><button onClick={signOut}>Sign out</button></main>;
}
function ChangePassword({ user }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (form.get("password") !== form.get("confirm")) throw new Error("The new passwords must match.");
      await changePassword(form.get("currentPassword"), form.get("password"));
      updateSessionUser({ ...user, mustChangePassword: false }); window.location.reload();
    } catch (requestError) { setError(requestError.message); setBusy(false); }
  }
  return <main className="login-panel"><div className="login-card"><h1>Set your password</h1><p>Choose a new password before opening your workspace.</p><form onSubmit={submit}>
    <label className="field">Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
    <label className="field">New password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
    <label className="field">Confirm new password<input name="confirm" type="password" autoComplete="new-password" required /></label>
    {error && <p role="alert">{error}</p>}<button className="login-button" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
  </form><button onClick={signOut}>Sign out</button></div></main>;
}
