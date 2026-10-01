import PDFDocument from "pdfkit";

import { AppDataSource }
  from "../data-source.js";
import { getStudentContext } from "./student-context.service.js";
import { getIntakeAcademicYear, getStudyPeriod } from "./student-academic-period.service.js";

export async function generateResultPdf(
  userId
) {

  const student = await getStudentContext(userId);

  const rows =
    await AppDataSource.query(
      `
      SELECT

        m.module_code AS moduleCode,
        m.module_name AS moduleTitle,
        m.credits AS credits,

        sem.semester_name AS semesterName,
        sem.academic_year AS academicYear,

        fr.final_grade AS finalGrade

      FROM FINAL_RESULTS fr

      INNER JOIN ENROLLMENTS e
        ON e.enrollment_id =
           fr.enrollment_id

      INNER JOIN MODULE_OFFERINGS mo
        ON mo.offering_id =
           e.offering_id

      INNER JOIN MODULES m
        ON m.module_id =
           mo.module_id

      INNER JOIN SEMESTERS sem
        ON sem.semester_id =
           mo.semester_id

      WHERE e.student_id = ?

        AND fr.status = 'PUBLISHED'

      ORDER BY
        sem.start_date DESC,
        m.module_code
      `,
      [userId]
    );

  return new Promise((resolve, reject) => {

    const doc =
      new PDFDocument();

    const chunks = [];

    doc.on(
      "data",
      (chunk) => chunks.push(chunk)
    );

    doc.on(
      "end",
      () => resolve(
        Buffer.concat(chunks)
      )
    );

    doc.on(
      "error",
      reject
    );

    doc.fontSize(20)
      .text(
        "UniVerse UOV - Result Summary"
      );

    doc.moveDown();

    doc.fontSize(10)
      .text(
        `Generated: ${new Date().toLocaleString()}`
      );

    if (getIntakeAcademicYear(student)) {
      doc.text(`Intake academic year: ${getIntakeAcademicYear(student)}`);
    }

    doc.moveDown();

    for (const row of rows) {

      doc.fontSize(11)
        .text(
          `${row.moduleCode} - ${row.moduleTitle}`
        );

      doc.fontSize(10)
        .text(
          `Study period: ${getStudyPeriod(student, row.academicYear, row.semesterName).label}`
        );

      doc.text(
        `Credits: ${row.credits}`
      );

      doc.text(
        `Final Grade: ${row.finalGrade}`
      );

      doc.moveDown();
    }

    doc.end();
  });
}
