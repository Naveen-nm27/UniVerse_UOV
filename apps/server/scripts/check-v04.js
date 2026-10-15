import { readFile } from "node:fs/promises";
import { AppDataSource as db, initializeDatabase } from "../src/data-source.js";
try {
  await initializeDatabase();
  const [server] = await db.query(
    "SELECT DATABASE() AS databaseName, VERSION() AS version, @@lower_case_table_names AS caseMode",
  );
  const rows = await db.query(
    "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()",
  );
  const key = (name) => (Number(server.caseMode) === 0 ? name : name.toUpperCase());
  const actual = new Map();
  for (const row of rows) {
    const name = key(row.tableName);
    if (!actual.has(name)) actual.set(name, new Set());
    actual.get(name).add(row.columnName);
  }
  const sql = await readFile(new URL("../database/schema-v04.sql", import.meta.url), "utf8");
  const missingTables = [],
    missingColumns = {};
  for (const table of sql.matchAll(/CREATE TABLE `([A-Z_]+)` \(([\s\S]+?)\) ENGINE/g)) {
    const columns = actual.get(key(table[1]));
    if (!columns) {
      missingTables.push(table[1]);
      continue;
    }
    const missing = [...table[2].matchAll(/^\s*`([a-z_]+)`\s/gm)]
      .map((match) => match[1])
      .filter((name) => !columns.has(name));
    if (missing.length) missingColumns[table[1]] = missing;
  }
  const diagnostics = {};
  if (actual.has(key("USERS")))
    diagnostics.roles = await db.query(
      "SELECT role_code AS role,COUNT(*) AS total FROM USERS GROUP BY role_code",
    );
  if (actual.has(key("MODULE_OFFERINGS")) && actual.has(key("USERS"))) {
    diagnostics.offeringReferences =
      await db.query(`SELECT COUNT(*) AS offerings,COUNT(DISTINCT mo.lecturer_id) AS lecturerReferences,
      COUNT(DISTINCT mo.hall_id) AS hallReferences,SUM(u.user_id IS NULL OR u.role_code NOT IN ('LECTURER','HOD')) AS missingOrWrongLecturerRoles
      FROM MODULE_OFFERINGS mo LEFT JOIN USERS u ON u.user_id=mo.lecturer_id`);
  }
  if (actual.has(key("MODULES")))
    diagnostics.curriculumReferences = await db.query(
      "SELECT COUNT(DISTINCT programme_semester_id) AS count FROM MODULES",
    );
  const ready = !missingTables.length && !Object.keys(missingColumns).length;
  console.log(
    JSON.stringify({ ...server, ready, missingTables, missingColumns, diagnostics }, null, 2),
  );
  if (!ready) process.exitCode = 1;
} catch (error) {
  console.error(
    "Database check failed:",
    error.code || error.driverError?.code || "CONNECTION_FAILED",
  );
  process.exitCode = 1;
} finally {
  if (db.isInitialized) await db.destroy();
}
