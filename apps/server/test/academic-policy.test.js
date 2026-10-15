import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateGpa,
  selectGpaAttempts,
  completedCredits,
} from "../src/services/academic-calculation.policy.js";
import { studentSchema, positiveId } from "@universe/shared-validation";
import { campusDate } from "../src/utils/campus-time.js";
import { getStudyPeriod } from "../src/services/student-academic-period.service.js";
test("GPA is unavailable for no graded credit-bearing results", () => {
  assert.equal(calculateGpa([]), null);
  assert.equal(
    calculateGpa([
      { credits: 3, gradePoint: null },
      { credits: 0, gradePoint: 4 },
    ]),
    null,
  );
});
test("GPA uses weighted credits and rounds once", () => {
  assert.equal(
    calculateGpa([
      { credits: 3, gradePoint: "3.70" },
      { credits: 2, gradePoint: "4.00" },
    ]),
    3.82,
  );
  assert.equal(
    calculateGpa([
      { credits: 1, gradePoint: "2.00" },
      { credits: 1, gradePoint: "2.01" },
    ]),
    2.01,
  );
});
test("Repeat results require an explicit policy and latest selects one attempt", () => {
  const rows = [
    { resultId: 1, moduleId: 7, attemptNumber: 1, gradePoint: 0 },
    { resultId: 3, moduleId: 7, attemptNumber: 2, gradePoint: 3 },
    { resultId: 2, moduleId: 7, attemptNumber: 2, gradePoint: 2 },
    { resultId: 4, moduleId: 8, attemptNumber: 1, gradePoint: 4 },
  ];
  assert.equal(selectGpaAttempts(rows, "UNCONFIGURED"), null);
  assert.deepEqual(
    selectGpaAttempts(rows, "LATEST").map((r) => r.resultId),
    [3, 4],
  );
  assert.equal(selectGpaAttempts(rows, "ALL").length, 4);
});
test("Failed and repeated attempts cannot inflate completed credits", () => {
  const rows = [
    { moduleId: 1, credits: 3, finalGrade: "F" },
    { moduleId: 1, credits: 3, finalGrade: "C" },
    { moduleId: 1, credits: 3, finalGrade: "A" },
    { moduleId: 2, credits: 2, finalGrade: "F" },
  ];
  assert.equal(completedCredits(rows, []), null);
  assert.equal(completedCredits(rows, ["A", "C"]), 3);
});
test("Latest attempt follows teaching period when a new offering resets its attempt number", () => {
  const rows = [
    { moduleId: 7, resultId: 1, attemptNumber: 2, semesterStartDate: "2025-09-01" },
    { moduleId: 7, resultId: 2, attemptNumber: 1, semesterStartDate: "2026-09-01" },
  ];
  assert.equal(selectGpaAttempts(rows, "LATEST")[0].resultId, 2);
});
test("Student creation uses integer IDs and rejects actor/role injection", () => {
  const payload = {
    fullName: "Student",
    email: "student@example.com",
    password: "temporary-password",
    role: "STUDENT",
    registrationNumber: "ICT001",
    batchId: 1,
    programmeId: 2,
    startDate: "2026-01-01",
  };
  assert.equal(studentSchema.parse(payload).batchId, 1);
  assert.equal(studentSchema.safeParse({ ...payload, role: "MA" }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, createdBy: 999 }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, batchId: "legacy-uuid" }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, startDate: "2026-02-31" }).success, false);
});
test("IDs reject boolean, fractional and misleading numeric encodings", () => {
  for (const value of [true, false, 0, -1, 1.5, "1e3", "0x10", " 1 ", "", null, 4294967296])
    assert.equal(positiveId.safeParse(value).success, false, String(value));
  assert.equal(positiveId.parse("123"), 123);
});
test("Campus dates switch at Colombo midnight", () => {
  assert.equal(campusDate(new Date("2026-10-08T18:29:00Z")), "2026-10-08");
  assert.equal(campusDate(new Date("2026-10-08T18:30:00Z")), "2026-10-09");
});
test("Repeating a first-year module retains its curriculum study-year label", () => {
  const period = getStudyPeriod({ batchStartDate: "2025-09-01" }, "2027/2028", "Semester 1", 1);
  assert.equal(period.label, "Y01S01");
  assert.equal(period.studyYear, 1);
});
