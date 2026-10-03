import test from "node:test";
import assert from "node:assert/strict";
import { calculateGpa, selectGpaAttempts, completedCredits } from "../src/services/academic-calculation.policy.js";
import { studentSchema } from "@universe/shared-validation";
test("GPA is unavailable for no graded credit-bearing results", () => {
  assert.equal(calculateGpa([]), null);
  assert.equal(calculateGpa([{ credits: 3, gradePoint: null }, { credits: 0, gradePoint: 4 }]), null);
});
test("GPA uses weighted credits and rounds once", () => {
  assert.equal(calculateGpa([{ credits: 3, gradePoint: "3.70" }, { credits: 2, gradePoint: "4.00" }]), 3.82);
  assert.equal(calculateGpa([{ credits: 1, gradePoint: "2.00" }, { credits: 1, gradePoint: "2.01" }]), 2.01);
});
test("Repeat results require an explicit policy and latest selects one attempt", () => {
  const rows = [{ resultId: 1, moduleId: 7, attemptNumber: 1, gradePoint: 0 },
    { resultId: 3, moduleId: 7, attemptNumber: 2, gradePoint: 3 },
    { resultId: 2, moduleId: 7, attemptNumber: 2, gradePoint: 2 },
    { resultId: 4, moduleId: 8, attemptNumber: 1, gradePoint: 4 }];
  assert.equal(selectGpaAttempts(rows, "UNCONFIGURED"), null);
  assert.deepEqual(selectGpaAttempts(rows, "LATEST").map((r) => r.resultId), [3, 4]);
  assert.equal(selectGpaAttempts(rows, "ALL").length, 4);
});
test("Failed and repeated attempts cannot inflate completed credits", () => {
  const rows = [{ moduleId: 1, credits: 3, finalGrade: "F" }, { moduleId: 1, credits: 3, finalGrade: "C" },
    { moduleId: 1, credits: 3, finalGrade: "A" }, { moduleId: 2, credits: 2, finalGrade: "F" }];
  assert.equal(completedCredits(rows, []), null);
  assert.equal(completedCredits(rows, ["A", "C"]), 3);
});
test("Student creation uses integer IDs and rejects actor/role injection", () => {
  const payload = { fullName: "Student", email: "student@example.com", password: "temporary-password",
    role: "STUDENT", registrationNumber: "ICT001", batchId: 1, programmeId: 2, startDate: "2026-01-01" };
  assert.equal(studentSchema.parse(payload).batchId, 1);
  assert.equal(studentSchema.safeParse({ ...payload, role: "MA" }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, createdBy: 999 }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, batchId: "legacy-uuid" }).success, false);
  assert.equal(studentSchema.safeParse({ ...payload, startDate: "2026-02-31" }).success, false);
});
