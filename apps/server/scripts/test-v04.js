// Runs only against a new temporary MySQL data directory; the configured application database is never used.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import mysql from "mysql2/promise";
const mysqld =
  process.env.MYSQLD_PATH ||
  (process.platform === "win32"
    ? "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe"
    : "mysqld");
const dir = await mkdtemp(path.join(tmpdir(), "universe-mysql-"));
let server, connection, exitPromise;
function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true, ...options });
    let stderr = "";
    child.stderr?.on("data", (data) => {
      stderr += data;
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${path.basename(cmd)} exited ${code}: ${stderr.slice(-1000)}`)),
    );
  });
}
try {
  console.log("Initializing an isolated MySQL V04 fixture...");
  await run(mysqld, ["--no-defaults", "--initialize-insecure", `--datadir=${dir}`]);
  const socket = net.createServer();
  await new Promise((r) => socket.listen(0, "127.0.0.1", r));
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
  server = spawn(
    mysqld,
    [
      "--no-defaults",
      `--datadir=${dir}`,
      `--port=${port}`,
      "--bind-address=127.0.0.1",
      "--mysqlx=OFF",
      "--skip-log-bin",
      "--default-time-zone=+00:00",
    ],
    { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
  );
  let startupError = "";
  server.stderr.on("data", (data) => {
    startupError += data;
  });
  exitPromise = new Promise((r) => server.once("exit", r));
  server.on("error", (error) => {
    startupError = error.message;
  });
  for (let i = 0; i < 150; i++) {
    try {
      connection = await mysql.createConnection({
        host: "127.0.0.1",
        port,
        user: "root",
        password: "",
        multipleStatements: true,
        connectTimeout: 500,
      });
      break;
    } catch {
      if (server.exitCode !== null) throw new Error(startupError.slice(-1500));
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (!connection) throw new Error("Temporary MySQL did not start.");
  await connection.query("CREATE DATABASE universe_integration_test CHARACTER SET utf8mb4");
  await connection.query("USE universe_integration_test");
  await connection.query(
    await readFile(new URL("../database/schema-v04.sql", import.meta.url), "utf8"),
  );
  await connection.query(
    "CREATE USER 'universe_fixture'@'127.0.0.1' IDENTIFIED BY 'fixture-only-password'; GRANT ALL ON universe_integration_test.* TO 'universe_fixture'@'127.0.0.1'",
  );
  const env = {
    ...process.env,
    UNIVERSE_V04_TEST: "1",
    DB_HOST: "127.0.0.1",
    DB_PORT: String(port),
    DB_USER: "universe_fixture",
    DB_PASSWORD: "fixture-only-password",
    UNIVERSE_BROWSER_SMOKE: process.argv.includes("--browser") ? "1" : "0",
    DB_NAME: "universe_integration_test",
    JWT_SECRET: "isolated-v04-test-secret",
    PASSING_GRADES: "A,B,C",
    GPA_REPEAT_POLICY: "LATEST",
  };
  await run(process.execPath, ["--test", "test/v04-integration.test.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env,
    stdio: ["ignore", "inherit", "pipe"],
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    try {
      await connection.query("SHUTDOWN");
    } catch {}
    await connection.end().catch(() => {});
  }
  if (server && server.exitCode === null) {
    await Promise.race([exitPromise, new Promise((r) => setTimeout(r, 5000))]);
    if (server.exitCode === null) server.kill();
    await exitPromise;
  }
  const resolved = path.resolve(dir),
    temporary = path.resolve(tmpdir());
  if (
    path.dirname(resolved) !== temporary ||
    !path.basename(resolved).startsWith("universe-mysql-")
  )
    throw new Error("Unexpected temporary database cleanup path.");
  await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
