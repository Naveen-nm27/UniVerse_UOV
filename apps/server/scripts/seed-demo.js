import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { pathToFileURL } from "node:url";

const seedKey = "universe-demo-v1";
const defaultPassword = "UniVerseDemo@2026!";

// Only inserts demo records. The audit marker and all data commit together.
export async function seedDemo(connection, { password = defaultPassword } = {}) {
  if (password.length < 12 || Buffer.byteLength(password) > 72)
    throw new Error(
      "DEMO_PASSWORD must contain at least 12 characters and at most 72 UTF-8 bytes.",
    );

  await connection.query("SET SESSION time_zone = '+05:30'");
  const [[database]] = await connection.query("SELECT DATABASE() AS name, CURRENT_DATE() AS today");
  if (!database.name) throw new Error("Select a V04 database before seeding.");
  const lockName = `universe-demo:${database.name}`.slice(0, 64);
  const [[lock]] = await connection.query("SELECT GET_LOCK(?, 10) AS acquired", [lockName]);
  if (Number(lock.acquired) !== 1)
    throw new Error("Another demo seed is running; try again shortly.");

  try {
    await connection.beginTransaction();
    try {
      const [[previous]] = await connection.query(
        "SELECT new_value FROM AUDIT_LOG WHERE table_name='DEMO_SEED' AND action='SEED' AND new_value->>'$.seed'=? LIMIT 1",
        [seedKey],
      );
      if (previous) {
        await connection.commit();
        const saved =
          typeof previous.new_value === "string"
            ? JSON.parse(previous.new_value)
            : previous.new_value;
        return { alreadySeeded: true, counts: saved.counts };
      }

      const counts = {};
      async function insert(table, values) {
        const [result] = await connection.query("INSERT INTO ?? SET ?", [table, values]);
        counts[table] = (counts[table] || 0) + 1;
        return result.insertId;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      let maId = null;
      async function account(name, login, role) {
        return insert("USERS", {
          name,
          email: `demo.seed.${login}@example.test`,
          password_hash: passwordHash,
          role_code: role,
          must_change_password: 0,
          created_by: maId,
        });
      }
      const today =
        database.today instanceof Date
          ? database.today.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" })
          : String(database.today);
      const anchor = new Date(`${today}T00:00:00Z`);
      const year = anchor.getUTCFullYear();
      const half = anchor.getUTCMonth() < 6 ? 0 : 6;
      const date = (value) => value.toISOString().slice(0, 10);
      const termStart = (offset) => date(new Date(Date.UTC(year, half + offset * 6, 1)));
      const termEnd = (offset) => date(new Date(Date.UTC(year, half + (offset + 1) * 6, 0)));
      const intake = termStart(-2);

      const departmentId = await insert("DEPARTMENTS", {
        department_name: "Seed Demo Computing",
        department_code: "SEED-DEMO-ICT",
      });
      const programmeId = await insert("PROGRAMMES", {
        programme_code: "SEED-DEMO-BICT",
        programme_name: "Demo BSc Information and Communication Technology",
        department_id: departmentId,
        duration_years: 3,
      });
      maId = await account("Demo Management Assistant", "ma", "MA");
      await insert("MA_STAFF", { user_id: maId, office_name: "Demo Exam Office" });
      const lecturerId = await account("Demo Lecturer", "lecturer", "LECTURER");
      const hodId = await account("Demo Head of Department", "hod", "HOD");
      for (const id of [lecturerId, hodId])
        await insert("LECTURERS", {
          user_id: id,
          department_id: departmentId,
          is_hod: id === hodId ? 1 : 0,
          date_joined: intake,
        });
      await connection.query("UPDATE DEPARTMENTS SET head_lecturer_id=? WHERE department_id=?", [
        hodId,
        departmentId,
      ]);
      await insert("DEANS", {
        user_id: await account("Demo Dean", "dean", "DEAN"),
        department_id: departmentId,
        appointed_at: intake,
      });
      await insert("ADMINISTRATORS", {
        user_id: await account("Demo Administrator", "admin", "ADMIN"),
        admin_level: "master",
      });
      const batchId = await insert("BATCHES", {
        batch_name: "Demo ICT Cohort",
        start_date: intake,
      });
      const hallId = await insert("HALLS", { hall_name: "Demo Lecture Hall", capacity: 60 });
      const deviceId = await insert("DEVICES", {
        device_serial: "DEMO-SEED-DEVICE-01",
        hall_id: hallId,
        updated_by: maId,
      });

      let [scale] = await connection.query(
        "SELECT grade FROM GRADE_SCALE ORDER BY grade_point DESC, grade",
      );
      // A fresh V04 database has no scale. These values are fictional demo policy.
      if (!scale.length) {
        for (const [grade, point] of [
          ["A", 4],
          ["B", 3],
          ["C", 2],
          ["F", 0],
        ])
          await insert("GRADE_SCALE", {
            grade,
            grade_point: point,
            description: "Fictional demonstration scale",
          });
        scale = ["A", "B", "C", "F"].map((grade) => ({ grade }));
      }
      const grades = scale.map((row) => row.grade);
      const semesters = [];
      const modules = [];
      for (const [index, name] of [
        "Programming Fundamentals",
        "Database Systems",
        "Web Development",
      ].entries()) {
        const offset = index - 2;
        semesters.push(
          await insert("SEMESTERS", {
            semester_name: `Seed Demo Semester ${index + 1}`,
            academic_year: `${termStart(offset).slice(0, 4)}/${Number(termStart(offset).slice(0, 4)) + 1}`,
            start_date: termStart(offset),
            end_date: termEnd(offset),
          }),
        );
        const curriculumId = await insert("PROGRAMME_SEMESTERS", {
          programme_id: programmeId,
          semester_number: index + 1,
          name: `Demo Curriculum Semester ${index + 1}`,
        });
        modules.push(
          await insert("MODULES", {
            module_code: `DEMO-ICT${index + 1}01`,
            module_name: name,
            credits: 3,
            programme_semester_id: curriculumId,
          }),
        );
      }

      const offerings = [];
      for (let index = 0; index < 4; index++) {
        const resit = index === 3;
        const offeringId = await insert("MODULE_OFFERINGS", {
          module_id: modules[resit ? 0 : index],
          semester_id: semesters[resit ? 2 : index],
          lecturer_id: lecturerId,
          hall_id: hallId,
          updated_by: maId,
        });
        const examId = await insert("EXAMS", {
          offering_id: offeringId,
          exam_type: resit ? "resit" : "final",
          is_resit: resit ? 1 : 0,
          exam_date: index < 2 ? termEnd(index - 2) : today,
        });
        const icas = [];
        for (let number = 1; number <= 3; number++)
          icas.push(
            await insert("MODULE_ICAS", {
              offering_id: offeringId,
              ica_number: number,
              title: `ICA ${number}`,
            }),
          );
        const sessions = [];
        if (index === 0 || index === 2) {
          const start = termStart(index - 2);
          const end = termEnd(index - 2);
          // Choose the current weekday so the first session always fits the term.
          const weekday = anchor.getUTCDay() || 7;
          const slotId = await insert("TIMETABLE_SLOTS", {
            offering_id: offeringId,
            hall_id: hallId,
            day_of_week: weekday,
            start_time: "09:00:00",
            end_time: "10:00:00",
            effective_from: start,
            effective_until: end,
            updated_by: maId,
          });
          const last = new Date(`${index === 2 ? today : end}T00:00:00Z`);
          last.setUTCDate(last.getUTCDate() - ((last.getUTCDay() - anchor.getUTCDay() + 7) % 7));
          for (let week = 0; week < 8; week++) {
            const day = new Date(last);
            day.setUTCDate(day.getUTCDate() - week * 7);
            const sessionDate = date(day);
            if (sessionDate < start) break;
            const sessionId = await insert("LECTURE_SESSIONS", {
              offering_id: offeringId,
              slot_id: slotId,
              hall_id: hallId,
              device_id: deviceId,
              session_date: sessionDate,
              opened_at: `${sessionDate} 09:00:00`,
              closed_at: `${sessionDate} 10:00:00`,
              opened_by: lecturerId,
            });
            sessions.push({ id: sessionId, date: sessionDate });
          }
        }
        offerings.push({ id: offeringId, examId, icas, sessions });
      }

      for (let index = 0; index < 28; index++) {
        const number = String(index + 1).padStart(2, "0");
        const studentId = await account(
          `Demo ICT Student ${number}`,
          `student${number}`,
          "STUDENT",
        );
        await insert("STUDENTS", {
          user_id: studentId,
          registration_number: `DEMO/ICT/${number}`,
          batch_id: batchId,
          current_semester: 3,
        });
        await insert("STUDENT_PROGRAMMES", {
          student_id: studentId,
          programme_id: programmeId,
          start_date: intake,
        });
        for (const [offeringIndex, offering] of offerings.entries()) {
          const resit = offeringIndex === 3;
          if (resit && index >= 2) continue;
          const enrollmentId = await insert("ENROLLMENTS", {
            student_id: studentId,
            offering_id: offering.id,
            attempt_number: resit ? 2 : 1,
            is_current: offeringIndex === 0 && index < 2 ? 0 : 1,
            status: offeringIndex === 2 ? "registered" : "completed",
            enrolled_at: `${termStart(Math.min(offeringIndex, 2) - 2)} 08:00:00`,
          });
          const grade =
            offeringIndex === 0 && index < 2
              ? grades.at(-1)
              : resit
                ? grades[Math.min(index, grades.length - 1)]
                : grades[(index + offeringIndex) % grades.length];
          for (const [icaIndex, icaId] of offering.icas.entries())
            await insert("ICA_GRADES", {
              ica_id: icaId,
              enrollment_id: enrollmentId,
              grade: grades[(index + icaIndex) % grades.length],
              entered_by: maId,
            });
          const status =
            offeringIndex === 2 && index >= 22
              ? ["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "RETURNED"][(index - 22) % 4]
              : "PUBLISHED";
          const resultId = await insert("FINAL_RESULTS", {
            enrollment_id: enrollmentId,
            exam_id: offering.examId,
            exam_grade: grade,
            final_grade: grade,
            status,
            entered_by: maId,
            updated_by: maId,
            published_at: status === "PUBLISHED" ? `${today} 08:00:00` : null,
          });
          const steps =
            status === "RETURNED"
              ? ["ENTERED", "RETURNED"]
              : ["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "PUBLISHED"];
          for (const [step, to] of steps.entries()) {
            await insert("RESULT_STATUS_HISTORY", {
              result_id: resultId,
              from_status: steps[step - 1] || null,
              to_status: to,
              note: "Fictional demo result",
              updated_by: maId,
            });
            if (to === status) break;
          }
          for (const [sessionIndex, session] of offering.sessions.entries()) {
            if ((index + sessionIndex) % 7 === 0) continue;
            const late = (index + sessionIndex) % 11 === 0;
            await insert("ATTENDANCE", {
              session_id: session.id,
              student_id: studentId,
              device_id: deviceId,
              scanned_at: `${session.date} ${late ? "09:15:00" : "09:00:00"}`,
              status: late ? "late" : "present",
              recorded_via: "demo-seed",
            });
          }
        }
      }
      await connection.query(
        "INSERT INTO AUDIT_LOG (table_name,row_id,action,actor_id,new_value) VALUES ('DEMO_SEED',?,'SEED',?,?)",
        [departmentId, maId, JSON.stringify({ seed: seedKey, counts })],
      );
      await connection.commit();
      return { alreadySeeded: false, counts };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
  }
}

async function main() {
  dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is only available in development.");
  const database = process.env.DB_NAME || "universe_uov_v04";
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 3307);
  console.log(`Seeding demo data into ${database} at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database,
    dateStrings: true,
    connectTimeout: 5000,
  });
  try {
    const result = await seedDemo(connection, { password: process.env.DEMO_PASSWORD });
    console.log(
      result.alreadySeeded
        ? "Demo data is already installed; no records or passwords were changed."
        : "Demo data installed successfully.",
    );
    console.log(JSON.stringify(result.counts, null, 2));
    console.log(
      "Accounts: demo.seed.{ma,lecturer,hod,dean,admin,student01..student28}@example.test",
    );
    console.log("See README.md for demo sign-in details.");
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(
      "Demo seed failed:",
      error.code === "ER_DUP_ENTRY"
        ? "A seed email or code already exists. The transaction was rolled back."
        : error.code || error.message,
    );
    process.exitCode = 1;
  });
