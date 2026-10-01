const API_BASE = "http://localhost:4000/api";

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Unable to sign in. Please try again.");
  return data;
}

function getSession() {
  try {
    const raw = localStorage.getItem("universe_session") || sessionStorage.getItem("universe_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function studentRequest(path) {
  const token = getSession()?.token;
  const res = await fetch(`${API_BASE}/student${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body.error || "Unable to load student data.");
  return body.data;
}

export function getStudentDashboard(semesterId) {
  return studentRequest(`/dashboard${semesterId ? `?semesterId=${semesterId}` : ""}`);
}

export function getStudentResults(semesterId) {
  return studentRequest(`/results${semesterId ? `?semesterId=${semesterId}` : ""}`);
}

export function getStudentAssessments(semesterId) {
  return studentRequest(`/assessments${semesterId ? `?semesterId=${semesterId}` : ""}`);
}

export async function downloadStudentResults() {
  const token = getSession()?.token;
  const res = await fetch(`${API_BASE}/student/downloads/result-summary`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Unable to download your result summary.");
  }
  return res.blob();
}
