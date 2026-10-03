export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");
export function getSession() {
  try {
    const raw = localStorage.getItem("universe_session") || sessionStorage.getItem("universe_session");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem("universe_session"); sessionStorage.removeItem("universe_session");
}
export function saveSession(session, remember = false) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem("universe_session", JSON.stringify(session));
}
export function updateSessionUser(user) {
  const session = getSession();
  if (session) saveSession({ ...session, user }, Boolean(localStorage.getItem("universe_session")));
}
export function signOut() { clearSession(); window.location.assign("/"); }
async function request(path, { body, auth = true, ...options } = {}) {
  const token = auth ? getSession()?.token : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options, body: body === undefined ? undefined : JSON.stringify(body),
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (auth && response.status === 401) signOut();
    const error = new Error(data.error?.message || data.message || (typeof data.error === "string" ? data.error : "The request could not be completed."));
    error.status = response.status; error.code = data.error?.code;
    throw error;
  }
  return response;
}
export async function apiRequest(path, options) { return (await request(path, options)).json(); }
export async function apiDownload(path, options) { return (await request(path, options)).blob(); }
export function queryString(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== null && value !== "") params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}
