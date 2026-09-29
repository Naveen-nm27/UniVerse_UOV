import { AppDataSource } from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";

export async function getStudentDashboard(userId) {

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

    ORDER BY
      fr.published_at DESC

    LIMIT 10
    `,
    [userId]
  );

  return {

    profile: {
      fullName: student.fullName,

      registrationNumber:
        student.registrationNumber,

      programme:
        student.programmeId
          ? {
              id: Number(student.programmeId),
              code: student.programmeCode,
              name: student.programmeName
            }
          : null,

      currentContext:
        student.currentSemester
          ? `Semester ${student.currentSemester}`
          : null
    },

    summary: {
      currentGpa: null,
      currentGpaLabel: null,
      cgpa: null,
      calculatedThrough: null,
      completedCredits: null,
      requiredCredits: null,
      latestPublishedResultCount:
        results.length
    },

    gpaTrend: [],

    latestResults: results.map((r) => ({
      resultId: Number(r.resultId),

      moduleCode: r.moduleCode,

      moduleTitle: r.moduleTitle,

      semesterLabel:
        `${r.academicYear} - ${r.semesterName}`,

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