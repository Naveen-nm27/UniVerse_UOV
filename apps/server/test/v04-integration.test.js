import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { AppDataSource as db, initializeDatabase } from "../src/data-source.js";
import { resetSchemaCache } from "../src/services/schema.service.js";
import { getPublishedResults } from "../src/services/student-results.service.js";
import { sessionVersion } from "../src/config/auth.js";

test(
  "All integrated roles against the authoritative MySQL V04 schema",
  { skip: process.env.UNIVERSE_V04_TEST !== "1" },
  async (t) => {
    assert.match(process.env.DB_NAME, /^universe_integration_test(?:_[a-f0-9]{12})?$/);
    await initializeDatabase();
    resetSchemaCache();
    const server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const hash = await bcrypt.hash("fixture-password", 4);
    async function req(route, { actor = 1, method = "GET", body } = {}) {
      const token = jwt.sign({ credentialVersion: sessionVersion(hash) }, process.env.JWT_SECRET, {
        subject: String(actor),
        expiresIn: "10m",
      });
      const res = await fetch(base + route, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : Buffer.from(await res.arrayBuffer());
      return { status: res.status, data };
    }
    try {
      await db.query(
        "INSERT INTO DEPARTMENTS (department_id,department_name,department_code) VALUES (1,'Computing','ICT'),(2,'Biology','BIO')",
      );
      await db.query(
        "INSERT INTO PROGRAMMES (programme_id,programme_code,programme_name,department_id,duration_years) VALUES (1,'ICT','ICT',1,3),(2,'BIO','Biology',2,3)",
      );
      for (const [id, role] of [
        [1, "MA"],
        [2, "LECTURER"],
        [3, "LECTURER"],
        [4, "HOD"],
        [5, "DEAN"],
        [6, "ADMIN"],
        [7, "STUDENT"],
        [8, "STUDENT"],
        [9, "STUDENT"],
      ]) {
        await db.query(
          "INSERT INTO USERS (user_id,name,email,password_hash,role_code,must_change_password) VALUES (?,?,?,?,?,0)",
          [id, `${role} ${id}`, `fixture${id}@example.test`, hash, role],
        );
      }
      await db.query("INSERT INTO MA_STAFF (user_id,office_name) VALUES (1,'Exam Office')");
      await db.query(
        "INSERT INTO LECTURERS (user_id,department_id,is_hod,date_joined) VALUES (2,1,0,'2020-01-01'),(3,2,0,'2020-01-01'),(4,1,1,'2020-01-01')",
      );
      await db.query("UPDATE DEPARTMENTS SET head_lecturer_id=4 WHERE department_id=1");
      await db.query(
        "INSERT INTO DEANS (user_id,department_id,appointed_at) VALUES (5,1,'2026-01-01')",
      );
      await db.query("INSERT INTO ADMINISTRATORS (user_id,admin_level) VALUES (6,'master')");
      await db.query("INSERT INTO BATCHES VALUES (1,'2026 Intake','2026-01-01')");
      for (const id of [7, 8, 9]) {
        await db.query(
          "INSERT INTO STUDENTS (user_id,registration_number,batch_id,current_semester) VALUES (?,?,1,1)",
          [id, `2026/ICT/${id}`],
        );
        await db.query(
          "INSERT INTO STUDENT_PROGRAMMES (student_id,programme_id,start_date) VALUES (?,?,'2026-01-01')",
          [id, id === 9 ? 2 : 1],
        );
      }
      await db.query(
        "INSERT INTO SEMESTERS VALUES (1,'Semester 1','2026/2027','2026-09-01','2027-01-31')",
      );
      await db.query(
        "INSERT INTO PROGRAMME_SEMESTERS VALUES (1,1,1,'Year 1 Semester 1'),(2,2,1,'Year 1 Semester 1')",
      );
      await db.query(
        "INSERT INTO MODULES (module_id,module_code,module_name,credits,programme_semester_id) VALUES (1,'ICT101','Programming',3,1),(2,'ICT102','Databases',2,1),(3,'BIO101','Biology',3,2)",
      );
      await db.query("INSERT INTO HALLS VALUES (1,'Hall A',100),(2,'Hall B',50)");
      await db.query(
        "INSERT INTO DEVICES (device_id,device_serial,hall_id,secret_ref) VALUES (1,'fixture-device-1',1,'never-expose-this'),(2,'fixture-device-2',2,'never-expose-this')",
      );
      await db.query(
        "INSERT INTO MODULE_OFFERINGS (offering_id,module_id,semester_id,lecturer_id,hall_id) VALUES (1,1,1,2,1),(2,2,1,2,1),(3,3,1,3,2)",
      );
      await db.query(
        "INSERT INTO ENROLLMENTS (enrollment_id,student_id,offering_id) VALUES (1,7,1),(2,8,1),(3,7,2),(4,9,3)",
      );
      await db.query(
        "INSERT INTO EXAMS (exam_id,offering_id,exam_type) VALUES (1,1,'final'),(2,2,'final'),(3,3,'final')",
      );
      await db.query(
        "INSERT INTO GRADE_SCALE VALUES ('A',4.00,'Excellent'),('B',3.00,'Good'),('C',2.00,'Pass'),('F',0.00,'Fail')",
      );
      await db.query("INSERT INTO MODULE_ICAS VALUES (1,1,1,'ICA 1'),(2,3,1,'ICA 1')");
      await db.query(
        "INSERT INTO ICA_GRADES (ica_id,enrollment_id,grade,entered_by) VALUES (1,1,'A',1),(1,2,'B',1)",
      );
      await db.query(
        "INSERT INTO FINAL_RESULTS (result_id,enrollment_id,exam_id,exam_grade,final_grade,status,entered_by,updated_by,published_at) VALUES (1,1,1,'A','A','PUBLISHED',1,1,NOW()),(2,2,1,'B','B','ENTERED',1,1,NULL),(3,3,2,'C','C','PUBLISHED',1,1,NOW()),(4,4,3,'B','B','PUBLISHED',1,1,NOW())",
      );
      await db.query(
        "INSERT INTO LECTURE_SESSIONS (session_id,offering_id,hall_id,device_id,session_date,opened_by) VALUES (1,1,1,1,'2026-10-09',2)",
      );
      await db.query("INSERT INTO ATTENDANCE (session_id,student_id,device_id) VALUES (1,7,1)");
      await db.query(
        "INSERT INTO TIMETABLE_SLOTS (offering_id,hall_id,day_of_week,start_time,end_time,effective_from,effective_until,updated_by) VALUES (1,1,7,'09:00','10:00','2026-10-01','2026-10-31',1)",
      );
      await t.test(
        "Subject list includes pending results without revealing unreleased ICA grades",
        async () => {
          const published = await req("/api/student/dashboard", { actor: 7 });
          assert.equal(published.status, 200);
          published.data = published.data.data;
          assert.equal(published.data.subjects.length, 2);
          const programming = published.data.subjects.find(
            (subject) => subject.moduleCode === "ICT101",
          );
          assert.equal(programming.finalGrade, "A");
          assert.deepEqual(
            programming.assessments.map((ica) => ica.number),
            [1, 2, 3],
          );
          assert.equal(programming.assessments[0].grade, "A");
          assert.equal(programming.assessments[1].status, "Not recorded");
          assert.equal(programming.studentCount, 1);
          const pending = await req("/api/student/dashboard", { actor: 8 });
          assert.equal(pending.status, 200);
          pending.data = pending.data.data;
          assert.equal(pending.data.subjects.length, 1);
          assert.equal(pending.data.subjects[0].finalGrade, null);
          assert.equal(pending.data.subjects[0].assessments[0].grade, null);
          assert.equal(pending.data.subjects[0].assessments[0].status, "Done · awaiting release");
          assert.equal(pending.data.subjects[0].studentCount, 1);
          assert.ok(pending.data.semesters.some((semester) => semester.id === 1));
          const filtered = await req("/api/student/dashboard?semesterId=999", { actor: 8 });
          assert.equal(filtered.status, 200);
          assert.deepEqual(filtered.data.data.subjects, []);
        },
      );
      await t.test("V04 entity names and mapped columns are unique and present", async () => {
        assert.equal(
          new Set(db.entityMetadatas.map((m) => m.name)).size,
          db.entityMetadatas.length,
        );
        const rows = await db.query(
          "SELECT TABLE_NAME AS tableName,COLUMN_NAME AS columnName,IS_NULLABLE AS nullable,DATA_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()",
        );
        for (const entity of db.entityMetadatas)
          for (const col of entity.columns) {
            const actual = rows.find(
              (r) =>
                r.tableName.toUpperCase() === entity.tableName && r.columnName === col.databaseName,
            );
            assert.ok(actual, `${entity.name}.${col.databaseName} is missing`);
            assert.equal(
              col.isNullable,
              actual.nullable === "YES",
              `${entity.name}.${col.databaseName} nullability`,
            );
          }
      });
      await t.test("All pooled connections store timestamps in campus time", async () => {
        const checks = await Promise.all(
          Array.from({ length: 12 }, () =>
            db.query("SELECT @@session.time_zone AS timezone, SLEEP(0.02)"),
          ),
        );
        assert.ok(checks.every((rows) => rows[0].timezone === "+05:30"));
      });
      await t.test("Canonical login and current-role authorization", async () => {
        const res = await req("/api/users/login", {
          method: "POST",
          body: { email: "fixture7@example.test", password: "fixture-password" },
        });
        assert.equal(res.status, 200);
        assert.equal(res.data.user.dashboardPath, "/student");
        assert.ok(!JSON.stringify(res.data).includes("passwordHash"));
        assert.equal((await req("/api/staff/dashboard", { actor: 7 })).status, 403);
        assert.equal((await req("/api/lecturer/dashboard", { actor: 7 })).status, 403);
        assert.equal((await req("/api/student/dashboard", { actor: 2 })).status, 403);
      });
      await t.test("Lecturer API counts distinct students and cannot cross ownership", async () => {
        const res = await req("/api/lecturer/dashboard", { actor: 2 });
        assert.equal(res.status, 200);
        assert.equal(Number(res.data.data.summary.enrolledStudents), 2);
        assert.equal(Number(res.data.data.summary.activeOfferings), 2);
        assert.equal((await req("/api/lecturer/offerings/3", { actor: 2 })).status, 404);
        assert.equal((await req("/api/lecturer/results/4/history", { actor: 2 })).status, 404);
        const semester = await req("/api/lecturer/semesters", { actor: 2 });
        assert.equal(semester.data.data[0].id, 1);
        assert.equal(
          (await req("/api/lecturer/offerings?semesterId=semester-1", { actor: 2 })).status,
          400,
        );
      });
      await t.test("Attendance counts scans once and preserves not-recorded students", async () => {
        const sessions = await req("/api/lecturer/sessions", { actor: 2 });
        assert.equal(Number(sessions.data.data[0].attendanceCount), 1);
        const res = await req("/api/lecturer/sessions/1/attendance", { actor: 2 });
        assert.equal(res.status, 200);
        assert.deepEqual(res.data.meta.summary, {
          rosterCount: 2,
          present: 1,
          late: 0,
          absent: 0,
          notRecorded: 1,
        });
        assert.match(res.data.data.find((r) => r.studentId === 7).scanTime, /\+05:30$/);
        assert.equal(
          (
            await req("/api/lecturer/sessions", {
              actor: 2,
              method: "POST",
              body: { offeringId: 1, hallId: 1 },
            })
          ).status,
          403,
        );
      });
      await t.test("Timetable uses V04 Monday=1 and Sunday=7", async () => {
        const res = await req("/api/lecturer/timetable?from=2026-10-11&to=2026-10-11", {
          actor: 2,
        });
        assert.equal(res.status, 200);
        assert.equal(res.data.data[0].day, "Sun");
        assert.equal(
          (await req("/api/lecturer/timetable?from=2026-10-12&to=2026-10-12", { actor: 2 })).data
            .data.length,
          0,
        );
      });
      await t.test("Student publication and department visibility", async () => {
        const rows = await getPublishedResults(7);
        assert.deepEqual(rows.map((r) => r.resultId).sort(), [1, 3]);
        assert.equal((await req("/api/student/results/2", { actor: 7 })).status, 404);
        const lecturer = await req("/api/lecturer/results", { actor: 2 });
        assert.equal(lecturer.data.data.find((r) => r.resultId === 2).finalGrade, null);
        for (const actor of [4, 5]) {
          const res = await req("/api/staff/results", { actor });
          assert.equal(res.status, 200);
          assert.ok(res.data.data.every((r) => r.moduleCode.startsWith("ICT")));
        }
        assert.equal((await req("/api/staff/results/4/history", { actor: 4 })).status, 404);
      });
      await t.test(
        "MA schema-backed module/department creation and actor-safe account profiles",
        async () => {
          const dept = await req("/api/ma/academic/departments", {
            method: "POST",
            body: { departmentName: "Physics", departmentCode: "PHY" },
          });
          assert.equal(dept.status, 201);
          const module = await req("/api/ma/academic/modules", {
            method: "POST",
            body: {
              moduleCode: "ICT103",
              moduleName: "Systems",
              credits: 2,
              programmeSemesterId: 1,
            },
          });
          assert.equal(module.status, 201);
          assert.equal(
            (
              await req("/api/ma/academic/modules/1", {
                method: "PATCH",
                body: {
                  moduleCode: "ICT101",
                  moduleName: "Programming",
                  credits: 4,
                  programmeSemesterId: 1,
                },
              })
            ).status,
            409,
          );
          const student = await req("/api/users", {
            method: "POST",
            body: {
              role: "STUDENT",
              fullName: "New Student",
              email: "newstudent@example.test",
              password: "temporary-password",
              registrationNumber: "2026/ICT/10",
              batchId: 1,
              programmeId: 1,
              startDate: "2026-09-01",
            },
          });
          assert.equal(student.status, 201);
          const staff = await req("/api/users", {
            method: "POST",
            body: {
              role: "LECTURER",
              fullName: "New Lecturer",
              email: "newlecturer@example.test",
              password: "temporary-password",
              departmentId: 1,
              dateJoined: "2026-09-01",
            },
          });
          assert.equal(staff.status, 201);
          assert.ok(await db.getRepository("Lecturer").existsBy({ userId: staff.data.data.id }));
          for (const [role, fields, entity] of [
            ["MA", { officeName: "Faculty Office" }, "MaStaff"],
            ["ADMIN", { adminLevel: "clerk" }, "Administrator"],
            ["DEAN", { departmentId: 2, appointedAt: "2026-09-01" }, "Dean"],
            ["HOD", { departmentId: 2, dateJoined: "2026-09-01" }, "Lecturer"],
          ]) {
            const created = await req("/api/users", {
              method: "POST",
              body: {
                role,
                fullName: `New ${role}`,
                email: `new${role.toLowerCase()}@example.test`,
                password: "temporary-password",
                ...fields,
              },
            });
            assert.equal(created.status, 201, JSON.stringify(created.data));
            assert.ok(await db.getRepository(entity).existsBy({ userId: created.data.data.id }));
          }
          assert.equal(
            (await req("/api/users", { actor: 6, method: "POST", body: { role: "MA" } })).status,
            403,
          );
        },
      );
      await t.test(
        "Grade offering links, validation locks, workflow ordering, conflict and atomic history",
        async () => {
          assert.equal(
            (
              await req("/api/ma/results/final-grades", {
                method: "POST",
                body: { enrollmentId: 2, examId: 3, examGrade: "A", finalGrade: "A" },
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await req("/api/ma/results/ica-grades", {
                method: "POST",
                body: { enrollmentId: 2, icaId: 2, grade: "A" },
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await req("/api/ma/results/2/status", {
                method: "POST",
                body: { fromStatus: "ENTERED", toStatus: "PUBLISHED" },
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await req("/api/ma/results/2/status", {
                method: "POST",
                body: { fromStatus: "ENTERED", toStatus: "VALIDATED" },
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await req("/api/ma/results/2/status", {
                method: "POST",
                body: { fromStatus: "ENTERED", toStatus: "RETURNED", note: "Fix grade" },
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await req("/api/ma/results/final-grades", {
                method: "POST",
                body: { enrollmentId: 2, examId: 1, examGrade: "A", finalGrade: "A" },
              })
            ).status,
            409,
          );
          const history = await req("/api/staff/results/2/history");
          assert.equal(history.data.data.length, 1);
          assert.equal(history.data.data[0].toStatus, "VALIDATED");
          const simultaneous = await Promise.all([
            req("/api/ma/results/2/status", {
              method: "POST",
              body: { fromStatus: "VALIDATED", toStatus: "WITH_DEAN_OFFICE" },
            }),
            req("/api/ma/results/2/status", {
              method: "POST",
              body: { fromStatus: "VALIDATED", toStatus: "RETURNED", note: "Correction" },
            }),
          ]);
          assert.deepEqual(simultaneous.map((r) => r.status).sort(), [200, 409]);
        },
      );
      await t.test("Audit failure rolls back result status and history", async () => {
        const [result] = await db.query("SELECT status FROM FINAL_RESULTS WHERE result_id=2");
        const [count] = await db.query(
          "SELECT COUNT(*) AS total FROM RESULT_STATUS_HISTORY WHERE result_id=2",
        );
        await db.query(
          "CREATE TRIGGER audit_failure BEFORE INSERT ON AUDIT_LOG FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture audit failure'",
        );
        try {
          const target = result.status === "WITH_DEAN_OFFICE" ? "PUBLISHED" : "ENTERED";
          assert.equal(
            (
              await req("/api/ma/results/2/status", {
                method: "POST",
                body: { fromStatus: result.status, toStatus: target },
              })
            ).status,
            500,
          );
          assert.equal(
            (await db.query("SELECT status FROM FINAL_RESULTS WHERE result_id=2"))[0].status,
            result.status,
          );
          assert.equal(
            (
              await db.query(
                "SELECT COUNT(*) AS total FROM RESULT_STATUS_HISTORY WHERE result_id=2",
              )
            )[0].total,
            count.total,
          );
        } finally {
          await db.query("DROP TRIGGER audit_failure");
        }
      });
      await t.test("Audit API redacts payloads; PDF is authenticated and valid", async () => {
        const res = await req("/api/staff/audit", { actor: 6 });
        assert.equal(res.status, 200);
        assert.ok(res.data.data.length);
        assert.ok(!JSON.stringify(res.data).includes("oldValue"));
        assert.equal((await req("/api/staff/audit", { actor: 4 })).status, 403);
        const pdf = await req("/api/student/downloads/result-summary", { actor: 7 });
        assert.equal(pdf.status, 200);
        assert.equal(pdf.data.subarray(0, 4).toString(), "%PDF");
      });
      await t.test(
        "Permission grants cannot bypass role boundaries and removed defaults stop writes",
        async () => {
          const [permission] = await db.query(
            "SELECT permission_id AS id FROM PERMISSIONS WHERE permission_name='grades.write'",
          );
          await db.query(
            "DELETE FROM ROLE_DEFAULT_PERMISSIONS WHERE role='MA' AND permission_id=?",
            [permission.id],
          );
          try {
            assert.equal(
              (
                await req("/api/ma/results/ica-grades", {
                  method: "POST",
                  body: { enrollmentId: 2, icaId: 1, grade: "A" },
                })
              ).status,
              403,
            );
          } finally {
            await db.query("INSERT INTO ROLE_DEFAULT_PERMISSIONS VALUES ('MA',?)", [permission.id]);
          }
          await db.query(
            "INSERT INTO USER_PERMISSIONS (user_id,permission_id,granted_by) VALUES (7,?,1)",
            [permission.id],
          );
          assert.equal(
            (
              await req("/api/ma/results/ica-grades", {
                actor: 7,
                method: "POST",
                body: { enrollmentId: 2, icaId: 1, grade: "A" },
              })
            ).status,
            403,
          );
        },
      );
      await t.test(
        "Malformed pre-existing cross-offering records are excluded from publication reads",
        async () => {
          await db.query(
            "INSERT INTO FINAL_RESULTS (result_id,enrollment_id,exam_id,exam_grade,final_grade,status,entered_by,updated_by,published_at) VALUES (11,2,3,'A','A','PUBLISHED',1,1,NOW())",
          );
          assert.equal((await req("/api/student/results/11", { actor: 8 })).status, 404);
          assert.equal((await req("/api/student/assessments", { actor: 8 })).data.data.length, 0);
          assert.ok(
            !(await req("/api/lecturer/results", { actor: 2 })).data.data.some(
              (r) => r.resultId === 11,
            ),
          );
        },
      );
      await t.test("GPA is withheld for multiple active programmes", async () => {
        await db.query(
          "INSERT INTO STUDENT_PROGRAMMES (student_id,programme_id,start_date) VALUES (7,2,'2026-09-01')",
        );
        try {
          const response = await req("/api/student/dashboard", { actor: 7 });
          assert.equal(response.status, 200);
          assert.equal(response.data.data.summary.cgpa, null);
          assert.equal(response.data.data.policy.programmeScopeUnambiguous, false);
        } finally {
          await db.query("DELETE FROM STUDENT_PROGRAMMES WHERE student_id=7 AND programme_id=2");
        }
      });
      if (process.env.UNIVERSE_BROWSER_SMOKE === "1")
        await t.test("All six roles in headless Edge", async () => {
          const { runBrowserChecks } = await import("../scripts/browser-smoke.js");
          await runBrowserChecks(base, sessionVersion(hash));
        });
    } finally {
      await new Promise((r) => server.close(r));
      await db.destroy();
    }
  },
);
