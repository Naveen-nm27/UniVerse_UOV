import test from "node:test";
import assert from "node:assert/strict";
import { mapStudentSubjects } from "../src/services/student-subjects.service.js";

const attempt = (overrides = {}) => ({
  enrollmentId: 1,
  moduleId: 10,
  moduleCode: "ICT101",
  moduleTitle: "Programming",
  semesterId: 1,
  academicYear: "2026/2027",
  semesterName: "Semester 1",
  attemptNumber: 1,
  attemptRank: 2,
  finalGrade: "F",
  icaNumber: 1,
  icaGrade: "C",
  icaDone: 1,
  ...overrides,
});
test("A passing repeat clears the resit warning even while viewing an older semester", () => {
  const rows = [
    attempt(),
    attempt({ enrollmentId: 2, semesterId: 2, attemptNumber: 2, attemptRank: 1, finalGrade: "C" }),
  ];
  const [subject] = mapStudentSubjects(rows, 1, ["A", "B", "C"]);
  assert.equal(subject.finalGrade, "F");
  assert.equal(subject.requiresResit, false);
  assert.equal(subject.attemptHistory.length, 2);
  assert.equal(mapStudentSubjects(rows, 2, ["A", "B", "C"])[0].finalGrade, "C");
  assert.deepEqual(mapStudentSubjects(rows, 3, ["C"]), []);
});
test("A pending repeat preserves a failed released result warning without exposing pending grades", () => {
  const rows = [
    attempt(),
    attempt({
      enrollmentId: 2,
      semesterId: 2,
      attemptNumber: 2,
      attemptRank: 1,
      finalGrade: null,
      icaGrade: "A",
    }),
  ];
  const [subject] = mapStudentSubjects(rows, null, ["A", "B", "C"]);
  assert.equal(subject.requiresResit, true);
  assert.equal(subject.resitGrade, "F");
  assert.equal(subject.finalGrade, null);
  assert.equal(subject.assessments[0].grade, null);
  assert.equal(subject.assessments.length, 3);
});
test("Missing publication or passing policy does not invent a resit requirement", () => {
  assert.equal(mapStudentSubjects([attempt()], null, [])[0].requiresResit, null);
  assert.equal(
    mapStudentSubjects([attempt({ finalGrade: null })], null, ["C"])[0].requiresResit,
    null,
  );
  assert.equal(
    mapStudentSubjects([attempt({ finalGrade: "C" })], null, ["C"])[0].requiresResit,
    false,
  );
});
