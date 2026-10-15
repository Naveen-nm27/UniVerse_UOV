import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
dotenv.config({ path: envPath, quiet: true });
const target = "universe_uov_v04";
let connection;
try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  const [existing] = await connection.query(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?",
    [target],
  );
  if (existing.length) throw new Error("V04_DATABASE_EXISTS");
  await connection.query(`CREATE DATABASE ${target} CHARACTER SET utf8mb4`);
  await connection.query(`USE ${target}`);
  const [[selected]] = await connection.query("SELECT DATABASE() AS name");
  if (selected.name !== target) throw new Error("UNEXPECTED_DATABASE");
  // The supplied fresh-install SQL runs only in the database just created above.
  await connection.query(
    await readFile(new URL("../database/schema-v04.sql", import.meta.url), "utf8"),
  );
  await connection.query("SET SESSION time_zone='+05:30'");
  const email = "ma.demo@example.test",
    password = randomBytes(24).toString("base64url");
  await connection.beginTransaction();
  const [user] = await connection.query(
    "INSERT INTO USERS (name,email,password_hash,role_code,must_change_password,created_by) VALUES (?,?,?,'MA',1,NULL)",
    ["Development Management Assistant", email, await bcrypt.hash(password, 12)],
  );
  await connection.query("INSERT INTO MA_STAFF (user_id,office_name) VALUES (?,'Development')", [
    user.insertId,
  ]);
  await connection.query(
    "INSERT INTO AUDIT_LOG (table_name,row_id,action,actor_id) VALUES ('USERS',?,'INSERT',?)",
    [user.insertId, user.insertId],
  );
  await connection.commit();
  const privateDir = path.join(root, ".local"),
    credentials = path.join(privateDir, "v04-access.json");
  await mkdir(privateDir, { recursive: true });
  await writeFile(
    credentials,
    JSON.stringify(
      { database: target, email, temporaryPassword: password, mustChangePassword: true },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  const previous = await readFile(envPath, "utf8");
  const updated = /^DB_NAME\s*=/m.test(previous)
    ? previous.replace(/^DB_NAME\s*=.*$/m, `DB_NAME=${target}`)
    : previous + `\nDB_NAME=${target}\n`;
  await writeFile(envPath, updated);
  // Keep local compose credentials private; never print their values.
  if ((process.env.DB_USER || "root") === "root") {
    const dockerEnv = path.join(root, "docker", ".env");
    try {
      await access(dockerEnv);
    } catch {
      await mkdir(path.dirname(dockerEnv), { recursive: true });
      await writeFile(
        dockerEnv,
        `MYSQL_ROOT_PASSWORD=${JSON.stringify(process.env.DB_PASSWORD || "")}\n`,
        { mode: 0o600 },
      );
    }
  }
  console.log(`Created ${target}; the previous database is preserved. This checkout now uses V04.`);
  console.log(`Bootstrap MA sign-in details: ${credentials}`);
} catch (error) {
  console.error("V04 setup failed:", error.code || error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
