import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { AppDataSource } from "../src/data-source.js";
import { resetSchemaCache } from "../src/services/schema.service.js";
const secret = "integration-test-secret-only";
test("Authentication and MA API integration", async (t) => {
  const original = { getRepository: AppDataSource.getRepository, query: AppDataSource.query, transaction: AppDataSource.transaction };
  const previousSecret = process.env.JWT_SECRET; process.env.JWT_SECRET = secret;
  const passwordHash = await bcrypt.hash("test-password", 4);
  let users = [
    { userId: 1, name: "MA Test", email: "ma@example.com", roleCode: "MA", isActive: true, passwordHash, mustChangePassword: false },
    { userId: 2, name: "Student Test", email: "student@example.com", roleCode: "STUDENT", isActive: true, passwordHash, mustChangePassword: false },
    { userId: 3, name: "Lecturer Test", email: "lecturer@example.com", roleCode: "LECTURER", isActive: true, passwordHash },
    { userId: 4, name: "Inactive MA", email: "inactive@example.com", roleCode: "MA", isActive: false, passwordHash },
  ];
  let failStudentSave = false;
  let capturedUser;
  const records = { Department: [{ departmentId: 1, departmentName: "Computing" }],
    Programme: [{ programmeId: 1, programmeCode: "ICT", programmeName: "ICT", departmentId: 1, durationYears: 4 }],
    Batch: [{ batchId: 1, batchName: "2026", startDate: "2026-01-01" }] };
  function repo(name) {
    if (name === "User") return {
      findOneBy: async (where) => users.find((u) => Object.entries(where).every(([key, value]) => u[key] === value)) || null,
      update: async (id, changes) => { Object.assign(users.find((u) => u.userId === id), changes); },
      create: (data) => data,
      save: async (data) => { if (users.some((u) => u.email === data.email)) throw Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" });
        capturedUser = data; const user = { ...data, userId: 10 + users.length }; users.push(user); return user; },
      createQueryBuilder: () => {
        let binding;
        const builder = { addSelect: () => builder, select: () => builder, where: (sql, args) => { binding = args; return builder; },
          orderBy: () => builder, skip: () => builder, take: () => builder,
          getOne: async () => users.find((u) => binding.email ? u.email === binding.email : u.userId === binding.userId),
          getManyAndCount: async () => [users, users.length] };
        return builder;
      },
    };
    return {
      findOneBy: async (where) => (records[name] || []).find((r) => Object.entries(where).every(([key, value]) => r[key] === value)) || null,
      existsBy: async (where) => (records[name] || []).some((r) => Object.entries(where).every(([key, value]) => r[key] === value)),
      find: async () => records[name] || [], findAndCount: async () => [records[name] || [], (records[name] || []).length],
      create: (data) => data,
      save: async (data) => { if (name === "Student" && failStudentSave) throw Object.assign(new Error("duplicate registration"), { code: "ER_DUP_ENTRY" }); return data; },
    };
  }
  AppDataSource.getRepository = repo;
  AppDataSource.transaction = async (run) => {
    const snapshot = structuredClone(users);
    try { return await run({ getRepository: repo }); } catch (error) { users = snapshot; throw error; }
  };
  AppDataSource.query = async (sql) => {
    if (sql.includes("information_schema")) return ["DEPARTMENTS", "PROGRAMMES", "BATCHES", "SEMESTERS", "MODULES"].map((tableName) => ({ tableName, columnName: "id" }));
    if (sql.includes("AS activeUsers")) return [{ activeUsers: 3, resultsAwaitingAction: 2 }];
    if (sql.includes("GROUP BY status")) return [{ status: "RETURNED", count: 2 }];
    throw new Error("Unexpected SQL in API test");
  };
  resetSchemaCache();
  const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id, claims = {}) => jwt.sign({ ...claims }, secret, { subject: String(id), expiresIn: "1h" });
  async function request(path, { id, token: suppliedToken, body, method = "GET" } = {}) {
    const response = await fetch(`${base}${path}`, { method,
      headers: { ...(id || suppliedToken ? { Authorization: `Bearer ${suppliedToken || token(id)}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, headers: response.headers, body: await response.json() };
  }
  try {
    await t.test("Login returns canonical role, destination and a verifiable token", async () => {
      const r = await request("/api/users/login", { method: "POST", body: { email: " MA@example.com ", password: "test-password" } });
      assert.equal(r.status, 200); assert.equal(r.body.user.role, "MA"); assert.equal(r.body.user.dashboardPath, "/ma");
      assert.equal(jwt.verify(r.body.token, secret).sub, "1"); assert.equal(JSON.stringify(r.body).includes(passwordHash), false);
      assert.equal((await request("/api/ma/dashboard", { token: r.body.token })).status, 200);
    });
    await t.test("Invalid login and malformed inputs return safe errors", async () => {
      assert.equal((await request("/api/users/login", { method: "POST", body: { email: "ma@example.com", password: "wrong" } })).status, 401);
      assert.equal((await request("/api/users/login", { method: "POST", body: { email: 123, password: [] } })).status, 400);
      assert.equal((await request("/api/users/login", { method: "POST", body: { email: "inactive@example.com", password: "test-password" } })).status, 401);
    });
    await t.test("Protected routes reject missing, invalid, expired and inactive sessions", async () => {
      assert.equal((await request("/api/ma/dashboard")).status, 401);
      assert.equal((await request("/api/ma/dashboard", { token: "invalid" })).status, 401);
      assert.equal((await request("/api/ma/dashboard", { token: jwt.sign({}, secret, { subject: "1", expiresIn: -1 }) })).status, 401);
      assert.equal((await request("/api/ma/dashboard", { id: 4 })).status, 401);
      assert.equal((await request("/api/ma/dashboard", { token: token("not-an-id") })).status, 401);
    });
    await t.test("Database role controls authorization despite forged token role", async () => {
      assert.equal((await request("/api/ma/dashboard", { token: token(2, { role: "MA" }) })).status, 403);
      assert.equal((await request("/api/student/results", { id: 1 })).status, 403);
      assert.equal((await request("/api/student/results", { id: 3 })).status, 403);
    });
    await t.test("Existing student tokens remain valid", async () => {
      const r = await request("/api/student/results?semesterId=invalid", { token: jwt.sign({ userId: 2, role: "STUDENT" }, secret) });
      assert.equal(r.status, 400);
    });
    await t.test("MA dashboard reports real counts, private caching and unavailable metrics", async () => {
      const r = await request("/api/ma/dashboard", { id: 1 }); assert.equal(r.status, 200);
      assert.equal(r.body.data.profile.fullName, "MA Test"); assert.equal(r.body.data.summary.activeUsers, 3);
      assert.equal(r.body.data.summary.todayLectureSessions, null); assert.match(r.headers.get("cache-control"), /no-store/);
    });
    await t.test("User creation cannot be called anonymously or by a student", async () => {
      assert.equal((await request("/api/users/register", { method: "POST", body: {} })).status, 401);
      assert.equal((await request("/api/users/register", { id: 2, method: "POST", body: {} })).status, 403);
    });
    await t.test("User listing redacts passwords and enforces bounded pagination", async () => {
      const r = await request("/api/users", { id: 1 }); assert.equal(r.status, 200);
      assert.equal(JSON.stringify(r.body).includes("passwordHash"), false);
      assert.equal((await request("/api/users?pageSize=1000", { id: 1 })).status, 400);
    });
    const newStudent = { fullName: "New Student", email: "new@example.com", password: "temporary-password", role: "STUDENT",
      registrationNumber: "ICT001", programmeId: 1, batchId: 1, startDate: "2026-01-01" };
    await t.test("Student creation hashes the password and takes actor ID from authentication", async () => {
      const r = await request("/api/users", { id: 1, method: "POST", body: newStudent }); assert.equal(r.status, 201);
      assert.equal(capturedUser.createdBy, 1); assert.equal(await bcrypt.compare(newStudent.password, capturedUser.passwordHash), true);
      assert.equal(r.body.data.mustChangePassword, true); assert.equal(JSON.stringify(r.body).includes(capturedUser.passwordHash), false);
      assert.equal((await request("/api/users", { id: 1, method: "POST", body: { ...newStudent, createdBy: 999 } })).status, 400);
    });
    await t.test("Profile errors roll back identity creation and return conflict errors", async () => {
      failStudentSave = true; const count = users.length;
      const r = await request("/api/users", { id: 1, method: "POST", body: { ...newStudent, email: "rollback@example.com" } });
      assert.equal(r.status, 409); assert.equal(users.length, count); failStudentSave = false;
    });
    await t.test("Creation rejects invalid programme references", async () => {
      const r = await request("/api/users", { id: 1, method: "POST", body: { ...newStudent, programmeId: 999 } }); assert.equal(r.status, 400);
    });
    await t.test("MA can deactivate accounts but cannot deactivate itself", async () => {
      assert.equal((await request("/api/users/1/status", { id: 1, method: "PATCH", body: { isActive: false } })).status, 409);
      assert.equal((await request("/api/users/2/status", { id: 1, method: "PATCH", body: { isActive: false } })).status, 200);
      assert.equal((await request("/api/student/results", { id: 2 })).status, 401);
      users.find((u) => u.userId === 2).isActive = true;
    });
    await t.test("Academic listing, schema availability and reference validation work", async () => {
      assert.equal((await request("/api/ma/academic/departments", { id: 1 })).body.data[0].departmentName, "Computing");
      const catalog = await request("/api/ma/academic/resources", { id: 1 });
      assert.equal(catalog.body.data.find((r) => r.key === "halls").available, false);
      assert.equal((await request("/api/ma/academic/halls", { id: 1 })).status, 503);
      assert.equal((await request("/api/ma/academic/batches", { id: 1, method: "POST", body: { name: "legacy", year: 2026 } })).status, 400);
      assert.equal((await request("/api/ma/academic/programmes", { id: 1, method: "POST", body: { programmeCode: "ICT", programmeName: "ICT", departmentId: 999, durationYears: 4 } })).status, 400);
      assert.equal((await request("/api/ma/academic/calendar-semesters", { id: 1, method: "POST", body: { semesterName: "S1", academicYear: "2026", startDate: "2026-06-01", endDate: "2026-01-01" } })).status, 400);
      assert.equal((await request("/api/ma/academic/departments/1", { id: 1, method: "PATCH", body: { departmentName: "Updated department" } })).status, 200);
    });
    await t.test("Student requests reject ownership injection and malformed IDs", async () => {
      assert.equal((await request("/api/student/results?studentId=999", { id: 2 })).status, 400);
      assert.equal((await request("/api/student/results/not-a-number", { id: 2 })).status, 400);
    });
    await t.test("Temporary passwords require a change before accessing domain routes", async () => {
      const student = users.find((u) => u.userId === 2); student.mustChangePassword = true;
      const response = await request("/api/student/results", { id: 2 });
      assert.equal(response.status, 403); assert.equal(response.body.error.code, "PASSWORD_CHANGE_REQUIRED");
      const me = await request("/api/users/me", { id: 2 }); assert.equal(me.status, 200);
      assert.equal(me.body.data.mustChangePassword, true); assert.equal(JSON.stringify(me.body).includes(passwordHash), false);
    });
    await t.test("Password changes verify the old password and clear the temporary-password flag", async () => {
      assert.equal((await request("/api/users/password", { id: 2, method: "POST", body: { currentPassword: "wrong", password: "changed-password" } })).status, 400);
      assert.equal((await request("/api/users/password", { id: 2, method: "POST", body: { currentPassword: "test-password", password: "changed-password" } })).status, 200);
      assert.equal(users.find((u) => u.userId === 2).mustChangePassword, false);
      assert.equal(await bcrypt.compare("changed-password", users.find((u) => u.userId === 2).passwordHash), true);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve)); Object.assign(AppDataSource, original); resetSchemaCache();
    if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  }
});
