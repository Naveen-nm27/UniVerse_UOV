import { AppDataSource } from "../src/data-source.js";
const targets = [
  ["USERS", "user_id"], ["STUDENT_PROGRAMMES", "student_programme_id"],
  ["DEPARTMENTS", "department_id"], ["PROGRAMMES", "programme_id"],
  ["BATCHES", "batch_id"], ["SEMESTERS", "semester_id"],
];
async function repair() {
  await AppDataSource.initialize();
  const columns = await AppDataSource.query(`SELECT TABLE_NAME AS tableName,
    COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, EXTRA AS extra
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_KEY='PRI'`);
  const pending = [];
  // Validate all targets before performing any schema changes.
  for (const [table, column] of targets) {
    const keys = columns.filter((row) => row.tableName === table);
    if (keys.length !== 1 || keys[0].columnName !== column || keys[0].columnType !== "int unsigned")
      throw new Error(`Unexpected primary-key schema for ${table}; no repair was started.`);
    if (!keys[0].extra.includes("auto_increment")) pending.push([table, column]);
  }
  if (!process.argv.includes("--apply")) {
    console.log("Dry run. Missing AUTO_INCREMENT:", pending.map(([t, c]) => `${t}.${c}`).join(", ") || "none");
    console.log("Use --apply to repair these existing unsigned integer primary keys without changing row data.");
    return;
  }
  for (const [table, column] of pending) {
    await AppDataSource.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` INT UNSIGNED NOT NULL AUTO_INCREMENT`);
    console.log(`Enabled AUTO_INCREMENT on ${table}.${column}`);
  }
  if (!pending.length) console.log("Generated primary keys are already configured.");
}
repair().catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(async () => { if (AppDataSource.isInitialized) await AppDataSource.destroy(); });
