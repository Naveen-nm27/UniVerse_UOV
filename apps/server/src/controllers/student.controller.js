import { getStudentDashboard } from "../services/student-dashboard.service.js";
import { getPublishedResults } from "../services/student-results.service.js";
import { getResultDetails } from "../services/student-result-details.service.js";
import { getStudentAssessments } from "../services/student-assessments.service.js";
import { generateResultPdf } from "../services/result-download.service.js";
import { getStudentContext } from "../services/student-context.service.js";
import { mapResult, mapAssessment } from "../services/student-dto.js";
export async function dashboard(req, res) {
  res.json({ data: await getStudentDashboard(req.auth.userId, req.validated.semesterId ?? null) });
}
export async function results(req, res) {
  const student = await getStudentContext(req.auth.userId);
  const rows = await getPublishedResults(req.auth.userId, req.validated.semesterId ?? null);
  res.json({ data: rows.map((row) => mapResult(row, student)) });
}
export async function assessments(req, res) {
  const student = await getStudentContext(req.auth.userId);
  const rows = await getStudentAssessments(req.auth.userId, req.validated.semesterId ?? null);
  res.json({ data: rows.map((row) => mapAssessment(row, student)) });
}
export async function resultDetails(req, res) {
  res.json({ data: await getResultDetails(req.auth.userId, req.validated.resultId) });
}
export async function downloadResults(req, res) {
  const pdf = await generateResultPdf(req.auth.userId, req.validated.semesterId ?? null);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="result-summary.pdf"');
  res.send(pdf);
}
