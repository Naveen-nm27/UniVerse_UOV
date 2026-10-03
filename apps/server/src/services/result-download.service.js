import PDFDocument from "pdfkit";
import { getStudentContext } from "./student-context.service.js";
import { getPublishedResults } from "./student-results.service.js";
import { getIntakeAcademicYear, getStudyPeriod } from "./student-academic-period.service.js";
export async function generateResultPdf(userId, semesterId = null) {
  const student = await getStudentContext(userId);
  const rows = await getPublishedResults(userId, semesterId);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(20).text("UniVerse UOV - Result Summary");
    doc.moveDown().fontSize(10).text("Unofficial summary of published results");
    doc.text(`${student.fullName} | ${student.registrationNumber}`);
    doc.text(`Generated: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date())}`);
    if (getIntakeAcademicYear(student)) doc.text(`Intake academic year: ${getIntakeAcademicYear(student)}`);
    doc.moveDown();
    if (!rows.length) doc.text("No published results are available for this period.");
    for (const row of rows) {
      if (doc.y > doc.page.height - 130) doc.addPage();
      doc.fontSize(11).text(`${row.moduleCode} - ${row.moduleTitle}`);
      doc.fontSize(10).text(`Study period: ${getStudyPeriod(student, row.academicYear, row.semesterName).label}`);
      doc.text(`Attempt: ${row.attemptNumber} | Credits: ${row.credits} | Final grade: ${row.finalGrade}`);
      doc.moveDown();
    }
    doc.end();
  });
}
