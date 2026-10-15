import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
const target = `universe_integration_test_${randomBytes(6).toString("hex")}`;
let connection,
  created = false;
try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  await connection.query(`CREATE DATABASE ${target} CHARACTER SET utf8mb4`);
  created = true;
  await connection.query(`USE ${target}`);
  const [[selected]] = await connection.query("SELECT DATABASE() AS name");
  if (selected.name !== target) throw new Error("Unexpected fixture database");
  await connection.query(
    await readFile(new URL("../database/schema-v04.sql", import.meta.url), "utf8"),
  );
  console.log("Running V04 checks in a disposable database on the configured Docker MySQL server.");
  const env = {
    ...process.env,
    DB_NAME: target,
    UNIVERSE_V04_TEST: "1",
    UNIVERSE_BROWSER_SMOKE: process.argv.includes("--browser") ? "1" : "0",
    JWT_SECRET: "isolated-docker-v04-test-secret",
    PASSING_GRADES: "A,B,C",
    GPA_REPEAT_POLICY: "LATEST",
  };
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--test", "test/v04-integration.test.js"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env,
      windowsHide: true,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Docker fixture checks exited ${code}`)),
    );
  });
} catch (error) {
  console.error(error.code || error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    if (created) {
      if (!/^universe_integration_test_[a-f0-9]{12}$/.test(target))
        throw new Error("Unexpected fixture cleanup target");
      await connection.query("USE information_schema");
      await connection.query(`DROP DATABASE ${target}`);
    }
    await connection.end();
  }
}
