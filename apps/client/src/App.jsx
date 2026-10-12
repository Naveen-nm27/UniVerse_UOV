import { useEffect, useState } from "react";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagementAssistantDashboard from "./pages/ma/ManagementAssistantDashboard";
import HodDashboard from "./pages/hod/HodDashboard";
import LoginForm from "./components/LoginForm";
import { apiRequest, setAuthToken } from "./api/client";
import "./App.css";

const roleDestinations = {
  ADMIN: "/admin",
  management_assistant: "/management-assistant/dashboard",
  hod: "/hod",
  HOD: "/hod",
  head_of_department: "/hod",
};

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [checkedSessionPath, setCheckedSessionPath] = useState("");
  const savedSession = path.startsWith("/admin") ? readSavedSession() : null;
  const restoringSession = path.startsWith("/admin") && !session && Boolean(savedSession?.token) && checkedSessionPath !== path;

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    const expireSession = () => {
      setSession(null);
      setAuthToken(null);
      localStorage.removeItem("universe_session");
      sessionStorage.removeItem("universe_session");
      window.history.replaceState({}, "", "/login");
      setPath("/login");
      setLoginMessage("Your session has expired. Please sign in again.");
    };
    window.addEventListener("popstate", updatePath);
    window.addEventListener("universe:unauthorized", expireSession);
    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("universe:unauthorized", expireSession);
    };
  }, []);

  useEffect(() => {
    if (!path.startsWith("/admin") || session) return undefined;
    const storedSession = readSavedSession();
    if (!storedSession?.token) {
      setAuthToken(null);
      return undefined;
    }

    const controller = new AbortController();
    setAuthToken(storedSession.token);
    apiRequest("/users/session", { signal: controller.signal })
      .then((verifiedSession) => {
        if (!verifiedSession?.user?.role) {
          throw new Error("The server did not return a verified session.");
        }
        setSession({ ...verifiedSession, token: storedSession.token });
        setLoginMessage("");
        setCheckedSessionPath(path);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setAuthToken(null);
        localStorage.removeItem("universe_session");
        sessionStorage.removeItem("universe_session");
        setLoginMessage(error.status === 404
          ? "This server cannot verify a saved session (GET /api/users/session is not implemented). Please sign in again."
          : error.message);
        setCheckedSessionPath(path);
      });
    return () => controller.abort();
  }, [path, session]);

  function navigate(nextPath) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }

  function handleLogin(verifiedSession, remember) {
    const destination = roleDestinations[verifiedSession?.user?.role];
    if (!destination) {
      setLoginMessage("Your account role is not supported in this application.");
      return false;
    }
    setSession(verifiedSession);
    setAuthToken(verifiedSession.token);
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem("universe_session");
    storage.setItem("universe_session", JSON.stringify(verifiedSession));
    setLoginMessage("");
    navigate(destination);
    return true;
  }

  function handleLogout() {
    setSession(null);
    setAuthToken(null);
    localStorage.removeItem("universe_session");
    sessionStorage.removeItem("universe_session");
    navigate("/login");
  }

  if (path.startsWith("/admin")) {
    if (restoringSession) {
      return <main className="route-message" role="status">Verifying your session…</main>;
    }
    if (!session) {
      return <LoginForm onLogin={handleLogin} initialMessage={loginMessage} />;
    }

    if (session.user?.role !== "ADMIN") {
      return (
        <main className="route-message" aria-labelledby="access-denied-title">
          <h1 id="access-denied-title">Administrator access required</h1>
          <p>This area is available only to an account whose server-confirmed role is ADMIN.</p>
          <button type="button" onClick={() => navigate("/")}>Return to your workspace</button>
        </main>
      );
    }
    return <AdminDashboard session={session} navigate={navigate} onLogout={handleLogout} />;
  }

  if (path === "/management-assistant/dashboard") {
    return <ManagementAssistantDashboard />;
  }
  if (path === "/hod") {
    return <HodDashboard />;
  }
  return <LoginForm onLogin={handleLogin} initialMessage={loginMessage} />;
}

function readSavedSession() {
  try {
    return JSON.parse(
      localStorage.getItem("universe_session") ||
      sessionStorage.getItem("universe_session") ||
      "null",
    );
  } catch {
    localStorage.removeItem("universe_session");
    sessionStorage.removeItem("universe_session");
    return null;
  }
}
