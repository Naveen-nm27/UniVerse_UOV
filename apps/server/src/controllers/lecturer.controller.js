import { AppDataSource } from "../data-source.js";
import { getLecturerContext } from "../services/lecturer-context.service.js";
import { getLecturerDashboard } from "../services/lecturer-dashboard.service.js";
import { getLecturerOfferings, getLecturerOfferingDetail } from "../services/lecturer-offerings.service.js";
import { getLecturerTimetable } from "../services/lecturer-timetable.service.js";
import { getLecturerSessions, getLecturerSessionById, openLectureSessionForOffering, closeLectureSessionById } from "../services/lecturer-sessions.service.js";
import { getSessionAttendance } from "../services/lecturer-attendance.service.js";
import { getOfferingAssessments } from "../services/lecturer-assessments.service.js";
import { getOfferingResults, getLecturerResultDetail, getResultHistory } from "../services/lecturer-results.service.js";

export async function me(req, res, next) {
  try {
    const data = await getLecturerContext(req.auth.userId);
    if (!data) {
      return res.status(403).json({
        error: {
          code: "LECTURER_PROFILE_REQUIRED",
          message: "A lecturer profile is required to access this workspace.",
        },
      });
    }
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function dashboard(req, res, next) {
  try {
    const data = await getLecturerDashboard(req.auth.userId, req.query.semesterId || null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function offerings(req, res, next) {
  try {
    const data = await getLecturerOfferings(req.auth.userId, req.query.semesterId || null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function offering(req, res, next) {
  try {
    const data = await getLecturerOfferingDetail(req.auth.userId, req.params.offeringId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function students(req, res, next) {
  try {
    const offeringId = Number(req.params.offeringId);
    const rows = await AppDataSource.query(
      `
        SELECT s.user_id AS id,
               u.name AS name,
               s.registration_number AS registrationNumber,
               en.attempt_number AS attemptNumber,
               en.status AS enrollmentStatus
        FROM ENROLLMENTS en
        JOIN STUDENTS s ON s.user_id = en.student_id
        JOIN USERS u ON u.user_id = s.user_id
        JOIN MODULE_OFFERINGS mo ON mo.offering_id = en.offering_id
        WHERE mo.lecturer_id = ? AND en.offering_id = ?
        ORDER BY u.name
      `,
      [req.auth.userId, offeringId]
    );

    res.json({
      data: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        registrationNumber: row.registrationNumber,
        batch: "2024",
        attemptNumber: Number(row.attemptNumber || 1),
        enrollmentStatus: row.enrollmentStatus,
      })),
      meta: { page: 1, totalPages: 1 },
    });
  } catch (error) {
    next(error);
  }
}

export async function timetable(req, res, next) {
  try {
    const data = await getLecturerTimetable(req.auth.userId, req.query.semesterId || null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function sessions(req, res, next) {
  try {
    const data = await getLecturerSessions(req.auth.userId, req.query.semesterId || null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function session(req, res, next) {
  try {
    const data = await getLecturerSessionById(req.auth.userId, req.params.sessionId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function attendance(req, res, next) {
  try {
    const data = await getSessionAttendance(req.auth.userId, req.params.sessionId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function openSession(req, res, next) {
  try {
    const data = await openLectureSessionForOffering(req.auth.userId, req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function closeSession(req, res, next) {
  try {
    const data = await closeLectureSessionById(req.auth.userId, req.params.sessionId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function assessments(req, res, next) {
  try {
    const data = await getOfferingAssessments(req.auth.userId, req.params.offeringId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function results(req, res, next) {
  try {
    const data = await getOfferingResults(req.auth.userId, req.params.offeringId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function result(req, res, next) {
  try {
    const data = await getLecturerResultDetail(req.auth.userId, req.params.resultId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function resultHistory(req, res, next) {
  try {
    const data = await getResultHistory(req.auth.userId, req.params.resultId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

