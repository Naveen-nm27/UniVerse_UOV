import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { AppDataSource } from "../src/data-source.js";
import { getAcademicResources, listAcademic } from "../src/services/academic.service.js";
import { resetSchemaCache } from "../src/services/schema.service.js";

test("Read-only database smoke checks", { skip: process.env.UNIVERSE_DB_SMOKE !== "1" }, async (t) => {
  let server;
  try {
    await AppDataSource.initialize();
    const students = await AppDataSource.query("SELECT user_id AS id FROM USERS WHERE role_code='STUDENT' AND is_active=1 AND must_change_password=0 ORDER BY user_id LIMIT 2");
    assert.ok(students.length, "An existing active student fixture is needed");
    const actor = students[0];
    server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = { Authorization: `Bearer ${jwt.sign({}, process.env.JWT_SECRET, { subject: String(actor.id), expiresIn: "5m" })}` };
    async function request(path) { return fetch(base + path, { headers }); }
    await t.test("Published result list contains only owned published records", async () => {
      const r = await request("/api/student/results"); assert.equal(r.status, 200);
      assert.match(r.headers.get("cache-control"), /no-store/);
      const body = await r.json();
      const records = await AppDataSource.query("SELECT fr.result_id AS id, fr.status, e.student_id AS studentId FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id");
      const expected = records.filter((row) => Number(row.studentId) === Number(actor.id) && row.status === "PUBLISHED");
      assert.deepEqual(body.data.map((r) => r.resultId).sort((a,b)=>a-b), expected.map((r) => Number(r.id)).sort((a,b)=>a-b));
    });
    await t.test("Foreign and unpublished result IDs remain hidden", async () => {
      const targets = await AppDataSource.query("SELECT fr.result_id AS id FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id WHERE e.student_id<>? OR fr.status<>'PUBLISHED' LIMIT 5", [actor.id]);
      for (const target of targets) assert.equal((await request(`/api/student/results/${target.id}`)).status, 404);
    });
    await t.test("Dashboard and assessments work with verified schema", async () => {
      for (const path of ["/api/student/dashboard", "/api/student/assessments"]) {
        const response = await request(path); assert.equal(response.status, 200, await response.clone().text());
        assert.ok((await response.json()).data);
      }
    });
    await t.test("Owned result history contains published attempts only", async () => {
      const [owned] = await AppDataSource.query("SELECT fr.result_id AS id FROM FINAL_RESULTS fr JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id WHERE e.student_id=? AND fr.status='PUBLISHED' LIMIT 1", [actor.id]);
      if (!owned) return;
      const response = await request(`/api/student/results/${owned.id}`); assert.equal(response.status, 200);
      const body = await response.json();
      for (const attempt of body.data.attemptHistory) assert.ok(attempt.resultId);
    });
    await t.test("Protected result download streams a PDF", async () => {
      const response = await request("/api/student/downloads/result-summary"); assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /application\/pdf/);
      assert.match(response.headers.get("cache-control"), /no-store/);
      const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
    });
    await t.test("Creation tables provide generated integer IDs", async () => {
      const rows = await AppDataSource.query("SELECT TABLE_NAME AS tableName, EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_KEY='PRI'");
      for (const table of ["USERS", "STUDENT_PROGRAMMES", "DEPARTMENTS", "PROGRAMMES", "BATCHES", "SEMESTERS"])
        assert.ok(rows.find((row) => row.tableName === table)?.extra.includes("auto_increment"), table + " needs AUTO_INCREMENT for account and academic creation");
    });
    await t.test("Available academic mappings query existing tables", async () => {
      const catalog = await getAcademicResources();
      for (const item of catalog.filter((r) => r.available)) {
        const result = await listAcademic(item.key); assert.ok(Array.isArray(result.data));
        assert.ok(result.meta.total >= result.data.length);
      }
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    resetSchemaCache(); if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
});
