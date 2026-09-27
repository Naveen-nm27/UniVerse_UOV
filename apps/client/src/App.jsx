import LoginForm from "./components/LoginForm";
import ManagementAssistantDashboard from "./pages/ma/ManagementAssistantDashboard";
import "./App.css";

function App() {
  return window.location.pathname.startsWith("/ma") ? <ManagementAssistantDashboard /> : <LoginForm />;
}

export default App;
