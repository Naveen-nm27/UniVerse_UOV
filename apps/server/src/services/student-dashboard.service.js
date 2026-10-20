import { AppDataSource } from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";
import { getPublishedResults } from "./student-results.service.js";
import { getStudentAssessments } from "./student-assessments.service.js";
import { getCurrentStudyPeriod, getIntakeAcademicYear } from "./student-academic-period.service.js";
import {
  calculateGpa,
  selectGpaAttempts,
  completedCredits,
  getPassingGrades,
} from "./academic-calculation.policy.js";
import { mapResult, mapAssessment } from "./student-dto.js";
import { getStudentSubjects } from "./student-subjects.service.js";

export async function getStudentDashboard(userId, semesterId = null) {
  const student = await getStudentContext(userId);
  const [allResults, assessments, subjects, enrolledSemesters, batchPerformance] =
    await Promise.all([
      getPublishedResults(userId),
      getStudentAssessments(userId, semesterId),
      getStudentSubjects(userId, semesterId),
      AppDataSource.query(
        `SELECT DISTINCT sem.semester_id AS id, sem.academic_year AS academicYear,
        sem.semester_name AS name, sem.start_date AS startDate
       FROM ENROLLMENTS e JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
       JOIN SEMESTERS sem ON sem.semester_id=mo.semester_id
       WHERE e.student_id=? ORDER BY sem.start_date, sem.semester_id`,
        [userId],
      ),
      AppDataSource.query(
        `WITH ranked_results AS (
      SELECT m.module_id AS moduleId, m.module_code AS moduleCode, m.module_name AS moduleTitle,
        fr.final_grade AS finalGrade, ROW_NUMBER() OVER (
          PARTITION BY e.student_id, m.module_id ORDER BY batch_sem.start_date DESC, e.attempt_number DESC, fr.published_at DESC, fr.result_id DESC
        ) AS attemptRank
      FROM FINAL_RESULTS fr
      INNER JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
      INNER JOIN EXAMS ex ON ex.exam_id=fr.exam_id AND ex.offering_id=e.offering_id
      INNER JOIN STUDENTS classmate ON classmate.user_id = e.student_id
      INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
      INNER JOIN SEMESTERS batch_sem ON batch_sem.semester_id=mo.semester_id
      INNER JOIN MODULES m ON m.module_id = mo.module_id
      WHERE classmate.batch_id = ? AND fr.status = 'PUBLISHED'
        AND (? IS NULL OR mo.semester_id = ?)
        AND EXISTS (SELECT 1 FROM ENROLLMENTS own_e
          INNER JOIN MODULE_OFFERINGS own_mo ON own_mo.offering_id = own_e.offering_id
          WHERE own_e.student_id = ? AND own_mo.module_id = m.module_id
            AND (? IS NULL OR own_mo.semester_id = ?))
    ) SELECT moduleId, moduleCode, moduleTitle, finalGrade, COUNT(*) AS gradeCount
      FROM ranked_results WHERE attemptRank = 1 GROUP BY moduleId, moduleCode, moduleTitle, finalGrade ORDER BY moduleCode`,
        [student.batchId, semesterId, semesterId, userId, semesterId, semesterId],
      ),
    ]);
  const visible = allResults.filter(
    (r) => semesterId == null || Number(r.semesterId) === Number(semesterId),
  );
  const chronological = [...allResults].sort(
    (a, b) =>
      new Date(a.semesterStartDate).getTime() - new Date(b.semesterStartDate).getTime() ||
      Number(a.semesterId) - Number(b.semesterId),
  );
  const latest = chronological.at(-1);
  const currentSemesterId = semesterId == null ? latest?.semesterId : semesterId;
  const current = allResults.filter((r) => Number(r.semesterId) === Number(currentSemesterId));
  const selectedAttempts = selectGpaAttempts(allResults);
  const currentAttempts = selectGpaAttempts(current);
  const groups = new Map();
  const semesters = new Map();
  for (const row of chronological) {
    const key = Number(row.semesterId);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
    semesters.set(key, { id: key, label: `${row.academicYear} - ${row.semesterName}` });
  }
  const batchModules = new Map();
  semesters.clear();
  for (const semester of enrolledSemesters) {
    semesters.set(Number(semester.id), {
      id: Number(semester.id),
      label: `${semester.academicYear} - ${semester.name}`,
    });
  }
  const gradeOrder = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
  for (const row of batchPerformance) {
    if (!batchModules.has(Number(row.moduleId)))
      batchModules.set(Number(row.moduleId), {
        moduleCode: row.moduleCode,
        moduleTitle: row.moduleTitle,
        studentCount: 0,
        gradeCounts: [],
      });
    const subject = batchModules.get(Number(row.moduleId));
    subject.studentCount += Number(row.gradeCount);
    subject.gradeCounts.push({ grade: row.finalGrade, count: Number(row.gradeCount) });
  }
  for (const subject of batchModules.values())
    subject.gradeCounts.sort((a, b) => {
      const rank = (grade) =>
        gradeOrder.includes(grade) ? gradeOrder.indexOf(grade) : gradeOrder.length;
      return rank(a.grade) - rank(b.grade);
    });
  const passingGrades = getPassingGrades();
  const programmeScopeUnambiguous =
    student.programmes.length <= 1 &&
    new Set(allResults.map((row) => row.resultProgrammeId)).size <= 1;
  return {
    profile: {
      fullName: student.fullName,
      registrationNumber: student.registrationNumber,
      academicYear: getIntakeAcademicYear(student),
      programmes: student.programmes,
      programme:
        student.programmeId && programmeScopeUnambiguous
          ? {
              id: Number(student.programmeId),
              code: student.programmeCode,
              name: student.programmeName,
            }
          : null,
      currentContext: getCurrentStudyPeriod(student.currentSemester),
    },
    summary: {
      currentGpa:
        !programmeScopeUnambiguous || currentAttempts == null
          ? null
          : calculateGpa(currentAttempts),
      currentGpaLabel: current[0]
        ? `${current[0].academicYear} - ${current[0].semesterName}`
        : null,
      cgpa:
        !programmeScopeUnambiguous || selectedAttempts == null
          ? null
          : calculateGpa(selectedAttempts),
      calculatedThrough: latest ? `${latest.academicYear} - ${latest.semesterName}` : null,
      completedCredits: completedCredits(visible, passingGrades),
      requiredCredits: null,
      latestPublishedResultCount: visible.length,
    },
    policy: {
      programmeScopeUnambiguous,
      repeatPolicyConfigured: selectedAttempts != null,
      passingGradesConfigured: passingGrades.length > 0,
    },
    gpaTrend: [...groups]
      .filter(([id]) => semesterId == null || id === Number(semesterId))
      .map(([id, rows]) => {
        const attempts = selectGpaAttempts(rows);
        return {
          label: semesters.get(id).label,
          value: !programmeScopeUnambiguous || attempts == null ? null : calculateGpa(attempts),
        };
      }),
    semesters: [...semesters.values()].reverse(),
    selectedSemesterId: semesterId == null ? null : Number(semesterId),
    batchPerformance: [...batchModules.values()],
    subjects: subjects.map((subject) => ({
      ...subject,
      gradeCounts: batchModules.get(subject.moduleId)?.gradeCounts || [],
      studentCount: batchModules.get(subject.moduleId)?.studentCount || 0,
    })),
    publishedResults: visible.map((row) => mapResult(row, student)),
    recentAssessments: assessments.map((row) => mapAssessment(row, student)),
    latestResults: [...visible]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 10)
      .map((row) => mapResult(row, student)),
    generatedAt: new Date().toISOString(),
  };
}
