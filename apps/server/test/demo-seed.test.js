import test from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { seedDemo } from "../scripts/seed-demo.js";
import app from "../src/app.js";
import { AppDataSource, initializeDatabase } from "../src/data-source.js";

test(
  "Demo seed against a disposable V04 database",
  { skip: process.env.UNIVERSE_DEMO_SEED_TEST !== "1" },
  async (t) => {
    assert.match(process.env.DB_NAME, /^universe_integration_test_[a-f0-9]{12}$/);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      dateStrings: true,
    });
    let server;
    async function snapshot() {
      const [tables] = await connection.query("SHOW TABLES");
      const result = {};
      for (const row of tables) {
        const table = Object.values(row)[0];
        const [[count]] = await connection.query("SELECT COUNT(*) AS total FROM ??", [table]);
        result[table] = Number(count.total);
      }
      return result;
    }
    try {
      // IDs are deliberately occupied; production-style data must survive.
      await connection.query(
        "INSERT INTO DEPARTMENTS (department_id,department_name,department_code) VALUES (77,'Existing department','DEMO-ICT')",
      );
      await connection.query(
        "INSERT INTO USERS (user_id,name,email,password_hash,role_code) VALUES (77,'Existing user','existing@example.test','unchanged-hash','MA')",
      );
      await connection.query("INSERT INTO MA_STAFF (user_id) VALUES (77)");
      await connection.query(
        "INSERT INTO GRADE_SCALE (grade,grade_point,description) VALUES ('A',3.9,'Existing scale'),('B',2.9,'Existing scale'),('C',1.9,'Existing scale'),('F',0,'Existing scale')",
      );
      const [existingScale] = await connection.query("SELECT * FROM GRADE_SCALE ORDER BY grade");
      await t.test("A conflict halfway through rolls back every demo insert", async () => {
        await connection.query(
          "INSERT INTO USERS (name,email,password_hash,role_code) VALUES ('Reserved email','demo.seed.student14@example.test','unchanged-hash','STUDENT')",
        );
        const before = await snapshot();
        await assert.rejects(seedDemo(connection), { code: "ER_DUP_ENTRY" });
        assert.deepEqual(await snapshot(), before);
        await connection.query("DELETE FROM USERS WHERE email='demo.seed.student14@example.test'");
      });

      await t.test(
        "Seed preserves existing records, scale, and generated ID relationships",
        async () => {
          const result = await seedDemo(connection);
          assert.equal(result.alreadySeeded, false);
          assert.equal(result.counts.USERS, 33);
          assert.equal(result.counts.STUDENTS, 28);
          assert.equal(result.counts.FINAL_RESULTS, 86);
          assert.equal(result.counts.ICA_GRADES, 258);
          const [scale] = await connection.query("SELECT * FROM GRADE_SCALE ORDER BY grade");
          assert.deepEqual(scale, existingScale);
          const [[existing]] = await connection.query(
            "SELECT name,password_hash FROM USERS WHERE user_id=77",
          );
          assert.deepEqual(existing, { name: "Existing user", password_hash: "unchanged-hash" });
          const [[department]] = await connection.query(
            "SELECT department_name FROM DEPARTMENTS WHERE department_id=77",
          );
          assert.equal(department.department_name, "Existing department");
          const [[mismatch]] = await connection.query(
            "SELECT COUNT(*) AS total FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id JOIN EXAMS ex ON ex.exam_id=fr.exam_id WHERE ex.offering_id<>e.offering_id",
          );
          assert.equal(Number(mismatch.total), 0);
          const [attempts] = await connection.query(
            `SELECT e.attempt_number,e.is_current,ex.is_resit,mo.module_id
           FROM ENROLLMENTS e JOIN USERS u ON u.user_id=e.student_id
           JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
           JOIN MODULES m ON m.module_id=mo.module_id
           JOIN FINAL_RESULTS fr ON fr.enrollment_id=e.enrollment_id
           JOIN EXAMS ex ON ex.exam_id=fr.exam_id
           WHERE u.email='demo.seed.student01@example.test' AND m.module_code='DEMO-ICT101'
           ORDER BY e.attempt_number`,
          );
          assert.equal(attempts.length, 2);
          assert.deepEqual(
            attempts.map((row) => row.attempt_number),
            [1, 2],
          );
          assert.deepEqual(
            attempts.map((row) => row.is_current),
            [0, 1],
          );
          assert.deepEqual(
            attempts.map((row) => row.is_resit),
            [0, 1],
          );
          assert.equal(attempts[0].module_id, attempts[1].module_id);
        },
      );

      await t.test("All six demo roles can sign in and load their dashboards", async () => {
        await initializeDatabase();
        server = app.listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}`;
        for (const [login, dashboard] of [
          ["ma", "ma"],
          ["lecturer", "lecturer"],
          ["hod", "staff"],
          ["dean", "staff"],
          ["admin", "staff"],
          ["student01", "student"],
        ]) {
          const response = await fetch(`${base}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: `demo.seed.${login}@example.test`,
              password: "UniVerseDemo@2026!",
            }),
          });
          assert.equal(response.status, 200, `${login} login`);
          const body = await response.json();
          const dashboardResponse = await fetch(`${base}/api/${dashboard}/dashboard`, {
            headers: { Authorization: `Bearer ${body.token}` },
          });
          assert.equal(dashboardResponse.status, 200, `${login} dashboard`);
        }
      });

      await t.test("A second run preserves row counts and later edits", async () => {
        const before = await snapshot();
        await connection.query(
          "UPDATE USERS SET name='Edited demo name',password_hash='edited-hash' WHERE email='demo.seed.student01@example.test'",
        );
        const second = await seedDemo(connection, { password: "DifferentDemoPassword!" });
        assert.equal(second.alreadySeeded, true);
        assert.deepEqual(await snapshot(), before);
        const [[user]] = await connection.query(
          "SELECT name,password_hash FROM USERS WHERE email='demo.seed.student01@example.test'",
        );
        assert.deepEqual(user, { name: "Edited demo name", password_hash: "edited-hash" });
      });
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      await connection.end();
    }
  },
);
