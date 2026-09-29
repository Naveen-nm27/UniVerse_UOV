import { AppDataSource } from "../data-source.js";

export async function getStudentCredits(userId) {

  const rows = await AppDataSource.query(
    `
    SELECT
      m.credits AS credits,
      fr.final_grade AS finalGrade,
      gs.grade_point AS gradePoint

    FROM FINAL_RESULTS fr

    INNER JOIN ENROLLMENTS e
      ON e.enrollment_id = fr.enrollment_id

    INNER JOIN MODULE_OFFERINGS mo
      ON mo.offering_id = e.offering_id

    INNER JOIN MODULES m
      ON m.module_id = mo.module_id

    LEFT JOIN GRADE_SCALE gs
      ON gs.grade = fr.final_grade

    WHERE e.student_id = ?

      AND fr.status = 'PUBLISHED'
    `,
    [userId]
  );

  const passingGrades =
    (process.env.PASSING_GRADES || "")
      .split(",")
      .map((grade) => grade.trim())
      .filter(Boolean);

  if (!passingGrades.length) {
    return {
      completedCredits: null,
      requiredCredits: null,
      policyConfigured: false
    };
  }

  const completedCredits =
    rows
      .filter((row) =>
        passingGrades.includes(row.finalGrade)
      )
      .reduce(
        (total, row) =>
          total + Number(row.credits),
        0
      );

  return {
    completedCredits,
    requiredCredits: null,
    policyConfigured: true
  };
}