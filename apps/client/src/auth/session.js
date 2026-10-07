export function readStoredSession() {
  try {
    const sessionSession = sessionStorage.getItem("universe_session");
    if (sessionSession) return JSON.parse(sessionSession);

    const localSession = localStorage.getItem("universe_session");
    return localSession ? JSON.parse(localSession) : null;
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
