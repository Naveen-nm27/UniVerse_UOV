import LoginForm from "./components/LoginForm";
import ManagementAssistantDashboard from "./pages/ma/ManagementAssistantDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import "./App.css";

function getPageForPath() {
  const pathname = window.location.pathname;

  if (pathname === "/" || pathname === "") {
    return <LoginForm />;
  }

  if (pathname.startsWith("/ma")) {
    return <ManagementAssistantDashboard />;
  }

  if (pathname.startsWith("/student")) {
    return <StudentDashboard />;
  }

  return <LoginForm />;
}

function App() {
  return getPageForPath();
}

export default App;
