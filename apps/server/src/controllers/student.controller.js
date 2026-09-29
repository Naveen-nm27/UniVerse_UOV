import {
  getStudentDashboard
} from "../services/student-dashboard.service.js";

import {
  getPublishedResults
} from "../services/student-results.service.js";

import {
  getResultDetails
} from "../services/student-result-details.service.js";

import {
  getStudentAssessments
} from "../services/student-assessments.service.js";

export async function assessments(
  req,
  res,
  next
) {

  try {

    const rows =
      await getStudentAssessments(
        req.auth.userId,
        req.query.semesterId || null
      );

    const data = rows.map((row) => ({
      assessmentId:
        Number(row.assessmentId),

      icaNumber:
        Number(row.icaNumber),

      title:
        row.title ||
        `ICA ${row.icaNumber}`,

      grade:
        row.grade,

      module: {
        id: Number(row.moduleId),
        code: row.moduleCode,
        title: row.moduleTitle
      },

      semester: {
        id: Number(row.semesterId),
        label:
          `${row.academicYear} - ${row.semesterName}`
      },

      released: true
    }));

    res.json({ data });

  } catch (error) {
    next(error);
  }
}

export async function resultDetails(
  req,
  res,
  next
) {

  try {

    const data =
      await getResultDetails(
        req.auth.userId,
        req.params.resultId
      );

    res.json({ data });

  } catch (error) {
    next(error);
  }
}

export async function results(req, res, next) {

  try {

    const semesterId =
      req.query.semesterId || null;

    const rows =
      await getPublishedResults(
        req.auth.userId,
        semesterId
      );

    const data = rows.map((row) => ({
      resultId: Number(row.resultId),

      module: {
        id: Number(row.moduleId),
        code: row.moduleCode,
        title: row.moduleTitle,
        credits: Number(row.credits)
      },

      semester: {
        id: Number(row.semesterId),
        label:
          `${row.academicYear} - ${row.semesterName}`
      },

      attemptNumber:
        Number(row.attemptNumber),

      finalGrade:
        row.finalGrade,

      gradePoint:
        row.gradePoint === null
          ? null
          : Number(row.gradePoint),

      creditsEarned: null,

      countsTowardGpa: null,

      outcomeCode: null
    }));

    res.json({
      data
    });

  } catch (error) {
    next(error);
  }
}

export async function dashboard(req, res, next) {
  try {

    const data =
      await getStudentDashboard(
        req.auth.userId
      );

    res.json({
      data
    });

  } catch (error) {
    next(error);
  }
}