import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AppDataSource as db, initializeDatabase } from "../src/data-source.js";
try {
  const api = "http://localhost:4000";
  assert.equal((await fetch("http://127.0.0.1:5173")).status, 200);
  const health = await fetch(`${api}/health`, { headers: { Origin: "http://127.0.0.1:5173" } });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("access-control-allow-origin"), "http://127.0.0.1:5173");
  await initializeDatabase();
  let credentials;
  try {
    credentials = JSON.parse(
      await readFile(new URL("../../../.local/v04-access.json", import.meta.url), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const account = credentials
    ? await db.getRepository("User").findOneBy({ email: credentials.email })
    : null;
  if (account?.mustChangePassword) {
    const login = await fetch(`${api}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.temporaryPassword }),
    });
    assert.equal(login.status, 200);
    const session = await login.json();
    assert.equal(session.user.role, "MA");
    assert.equal(session.user.mustChangePassword, true);
    const headers = { Authorization: `Bearer ${session.token}` };
    assert.equal((await fetch(`${api}/api/users/me`, { headers })).status, 200);
    const blocked = await fetch(`${api}/api/ma/dashboard`, { headers });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).error.code, "PASSWORD_CHANGE_REQUIRED");
  }
  console.log(
    "Live client/API and CORS are ready. Pending local bootstrap credentials, when present, pass authentication and first-password protection.",
  );
} catch (error) {
  console.error("Live check failed:", error.code || error.message);
  process.exitCode = 1;
} finally {
  if (db.isInitialized) await db.destroy();
}
