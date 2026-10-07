export function readStoredSession() {
  try {
    const salted = localStorage.getItem("universe_session") || sessionStorage.getItem("universe_session");
    return salted ? JSON.parse(salted) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem("universe_session");
  sessionStorage.removeItem("universe_session");
}

export function writeStoredSession(session, remember = false) {
  clearStoredSession();
  const target = remember ? localStorage : sessionStorage;
  target.setItem("universe_session", JSON.stringify(session));
}

export function getStoredRole() {
  const session = readStoredSession();
  return session?.user?.role ?? null;
}
