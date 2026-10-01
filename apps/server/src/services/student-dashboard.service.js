import { AppDataSource } from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";
import { getCurrentStudyPeriod, getIntakeAcademicYear, getStudyPeriod } from "./student-academic-period.service.js";

export async function getStudentDashboard(userId, semesterId = null) {

  const student =
    await getStudentContext(userId);

  const results = await AppDataSource.query(
    `
    SELECT
      fr.result_id AS resultId,
      m.module_code AS moduleCode,
      m.module_name AS moduleTitle,
      m.credits AS credits,

      s.semester_id AS semesterId,
      s.semester_name AS semesterName,
      s.academic_year AS academicYear,

      e.attempt_number AS attemptNumber,

      fr.final_grade AS finalGrade

    FROM FINAL_RESULTS fr

    INNER JOIN ENROLLMENTS e
      ON e.enrollment_id = fr.enrollment_id

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id

    INNER JOIN MODULES m
      ON m.module_id = mo.module_id

    INNER JOIN SEMESTERS s
      ON s.semester_id = mo.semester_id

    WHERE e.student_id = ?
      AND fr.status = 'PUBLISHED'
      AND (? IS NULL OR s.semester_id = ?)

    ORDER BY
      fr.published_at DESC

    LIMIT 10
    `,
    [userId, semesterId, semesterId]
  );

  const gradedResults = await AppDataSource.query(
    `
    SELECT sem.semester_id AS semesterId, sem.semester_name AS semesterName,
      sem.academic_year AS academicYear, m.module_code AS moduleCode,
      m.credits AS credits,
      gs.grade_point AS gradePoint
    FROM FINAL_RESULTS fr
    INNER JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
    INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
    INNER JOIN MODULES m ON m.module_id = mo.module_id
    INNER JOIN SEMESTERS sem ON sem.semester_id = mo.semester_id
    INNER JOIN GRADE_SCALE gs ON gs.grade = fr.final_grade
    WHERE e.student_id = ? AND fr.status = 'PUBLISHED'
      AND (? IS NULL OR sem.semester_id = ?)
    ORDER BY sem.start_date, sem.semester_id
    `,
    [userId, semesterId, semesterId]
  );

  const [{ publishedCount }] = await AppDataSource.query(
    `SELECT COUNT(*) AS publishedCount
     FROM FINAL_RESULTS fr
     INNER JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
     INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
     WHERE e.student_id = ? AND fr.status = 'PUBLISHED'
       AND (? IS NULL OR mo.semester_id = ?)`,
    [userId, semesterId, semesterId]
  );

  const semesters = await AppDataSource.query(
    `SELECT DISTINCT sem.semester_id AS id, sem.semester_name AS semesterName,
      sem.academic_year AS academicYear, sem.start_date AS startDate
     FROM FINAL_RESULTS fr
     INNER JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
     INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
     INNER JOIN SEMESTERS sem ON sem.semester_id = mo.semester_id
     WHERE e.student_id = ? AND fr.status = 'PUBLISHED'
     ORDER BY sem.start_date DESC`,
    [userId]
  );

  const batchPerformance = await AppDataSource.query(
    `WITH ranked_results AS (
       SELECT m.module_id AS moduleId, m.module_code AS moduleCode,
         m.module_name AS moduleTitle, fr.final_grade AS finalGrade,
         ROW_NUMBER() OVER (
           PARTITION BY e.student_id, m.module_id
           ORDER BY e.attempt_number DESC, fr.published_at DESC, fr.result_id DESC
         ) AS attemptRank
       FROM FINAL_RESULTS fr
       INNER JOIN ENROLLMENTS e ON e.enrollment_id = fr.enrollment_id
       INNER JOIN STUDENTS classmate ON classmate.user_id = e.student_id
       INNER JOIN MODULE_OFFERINGS mo ON mo.offering_id = e.offering_id
       INNER JOIN MODULES m ON m.module_id = mo.module_id
       WHERE classmate.batch_id = ? AND fr.status = 'PUBLISHED'
         AND (? IS NULL OR mo.semester_id = ?)
         AND EXISTS (
           SELECT 1 FROM ENROLLMENTS own_e
           INNER JOIN MODULE_OFFERINGS own_mo ON own_mo.offering_id = own_e.offering_id
           INNER JOIN FINAL_RESULTS own_fr ON own_fr.enrollment_id = own_e.enrollment_id
           WHERE own_e.student_id = ? AND own_mo.module_id = m.module_id
             AND own_fr.status = 'PUBLISHED'
             AND (? IS NULL OR own_mo.semester_id = ?)
         )
     )
     SELECT moduleId, moduleCode, moduleTitle, finalGrade,
       COUNT(*) AS gradeCount
     FROM ranked_results
     WHERE attemptRank = 1
     GROUP BY moduleId, moduleCode, moduleTitle, finalGrade
     ORDER BY moduleCode`,
    [student.batchId, semesterId, semesterId, userId, semesterId, semesterId]
  );

  const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
  const batchModules = new Map();
  for (const row of batchPerformance) {
    if (!batchModules.has(row.moduleId)) {
      batchModules.set(row.moduleId, {
        moduleCode: row.moduleCode,
        moduleTitle: row.moduleTitle,
        studentCount: 0,
        gradeCounts: []
      });
    }
    const module = batchModules.get(row.moduleId);
    const count = Number(row.gradeCount);
    module.studentCount += count;
    module.gradeCounts.push({ grade: row.finalGrade, count });
  }
  const batchGradeDistribution = [...batchModules.values()].map((module) => ({
    ...module,
    gradeCounts: module.gradeCounts.sort((a, b) => {
      const aRank = gradeOrder.indexOf(a.grade);
      const bRank = gradeOrder.indexOf(b.grade);
      return (aRank < 0 ? gradeOrder.length : aRank) - (bRank < 0 ? gradeOrder.length : bRank);
    })
  }));

  const totalCredits = gradedResults.reduce((sum, row) => sum + Number(row.credits), 0);
  const completedCoreCredits = gradedResults
    .filter((row) => !row.moduleCode.startsWith('ACU') && !['IT4226', 'CSH4226'].includes(row.moduleCode))
    .reduce((sum, row) => sum + Number(row.credits), 0);
  const honoursProgramme = ['BSC-IT-H', 'BSC-CS-H', 'BSC-ENS-H'].includes(student.programmeCode);
  const totalPoints = gradedResults.reduce((sum, row) => sum + Number(row.credits) * Number(row.gradePoint), 0);
  const currentSemesterId = gradedResults.at(-1)?.semesterId;
  const currentRows = gradedResults.filter((row) => row.semesterId === currentSemesterId);
  const currentCredits = currentRows.reduce((sum, row) => sum + Number(row.credits), 0);
  const currentPoints = currentRows.reduce((sum, row) => sum + Number(row.credits) * Number(row.gradePoint), 0);
  const groupedTrend = new Map();
  gradedResults.forEach((row) => {
    const key = getStudyPeriod(student, row.academicYear, row.semesterName).label;
    const current = groupedTrend.get(key) || { credits: 0, points: 0, label: key };
    current.credits += Number(row.credits);
    current.points += Number(row.credits) * Number(row.gradePoint);
    groupedTrend.set(key, current);
  });

  return {

    profile: {
      fullName: student.fullName,

      registrationNumber:
        student.registrationNumber,

      academicYear: getIntakeAcademicYear(student),

      programme:
        student.programmeId
          ? {
              id: Number(student.programmeId),
              code: student.programmeCode,
              name: student.programmeName
            }
          : null,

      currentContext: getCurrentStudyPeriod(student.currentSemester)
    },

    summary: {
      currentGpa: currentCredits ? Number((currentPoints / currentCredits).toFixed(2)) : null,
      currentGpaLabel: currentRows[0] ? getStudyPeriod(student, currentRows[0].academicYear, currentRows[0].semesterName).label : null,
      cgpa: totalCredits ? Number((totalPoints / totalCredits).toFixed(2)) : null,
      calculatedThrough: gradedResults.at(-1) ? getStudyPeriod(student, gradedResults.at(-1).academicYear, gradedResults.at(-1).semesterName).label : null,
      completedCredits: completedCoreCredits,
      requiredCredits: honoursProgramme && !semesterId ? 120 : null,
      latestPublishedResultCount: Number(publishedCount)
    },

    gpaTrend: [...groupedTrend.values()].map((item) => ({
      label: item.label,
      value: Number((item.points / item.credits).toFixed(2))
    })),

    semesters: semesters.map((semester) => ({
      id: Number(semester.id),
      ...getStudyPeriod(student, semester.academicYear, semester.semesterName)
    })),

    selectedSemesterId: semesterId ? Number(semesterId) : null,

    batchPerformance: batchGradeDistribution,

    latestResults: results.map((r) => ({
      resultId: Number(r.resultId),

      moduleCode: r.moduleCode,

      moduleTitle: r.moduleTitle,

      semesterLabel: getStudyPeriod(student, r.academicYear, r.semesterName).label,

      finalGrade: r.finalGrade,

      creditsEarned: null,

      attemptNumber:
        Number(r.attemptNumber),

      outcomeCode: null
    })),

    recentAssessments: [],

    notices: [],

    generatedAt:
      new Date().toISOString()
  };
}
