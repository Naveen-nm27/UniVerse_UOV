import { getStudyPeriod } from "./student-academic-period.service.js";
export function mapResult(row, student) {
  return { resultId: Number(row.resultId),
    module: { id: Number(row.moduleId), code: row.moduleCode, title: row.moduleTitle, credits: Number(row.credits) },
    semester: { id: Number(row.semesterId), ...getStudyPeriod(student, row.academicYear, row.semesterName) },
    attemptNumber: Number(row.attemptNumber), finalGrade: row.finalGrade,
    gradePoint: row.gradePoint == null ? null : Number(row.gradePoint),
    creditsEarned: null, countsTowardGpa: null, outcomeCode: null };
}
export function mapAssessment(row, student) {
  return { assessmentId: Number(row.assessmentId), icaNumber: Number(row.icaNumber),
    title: row.title || `ICA ${row.icaNumber}`, grade: row.grade,
    module: { id: Number(row.moduleId), code: row.moduleCode, title: row.moduleTitle },
    semester: { id: Number(row.semesterId), ...getStudyPeriod(student, row.academicYear, row.semesterName) }, released: true };
}
