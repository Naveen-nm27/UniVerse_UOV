import { clearStoredSession, readStoredSession } from "../auth/session";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const fallbackProfile = {
  id: 41,
  email: "lecturer@example.test",
  fullName: "Dr. N. Gunaratne",
  role: "LECTURER",
  department: "Computer Science",
  title: "Senior Lecturer",
  office: "Faculty of Computing",
  status: "Active",
};

const fallbackOverview = {
  summary: {
    activeOfferings: 6,
    enrolledStudents: 214,
    sessionsThisWeek: 14,
    attendanceRate: 89,
  },
  roomSchedule: [
    { id: 1, moduleCode: "CS 2013", title: "Data Structures", day: "Mon", time: "09:00", room: "C-204" },
    { id: 2, moduleCode: "CS 2112", title: "Operating Systems", day: "Tue", time: "11:30", room: "D-101" },
    { id: 3, moduleCode: "CS 2031", title: "Database Lab", day: "Wed", time: "13:00", room: "Lab 3" },
  ],
  sessions: [
    { id: 101, title: "Lecture 01", offeringId: 1, offeringCode: "CS 2013", date: "2026-10-08", startTime: "09:00", endTime: "10:30", status: "Scheduled", attendanceCount: 32, enrolledCount: 35, location: "C-204" },
    { id: 102, title: "Practical 02", offeringId: 2, offeringCode: "CS 2112", date: "2026-10-09", startTime: "13:00", endTime: "15:00", status: "In progress", attendanceCount: 28, enrolledCount: 30, location: "Lab 2" },
  ],
  offerings: [
    { id: 1, moduleId: 11, moduleCode: "CS 2013", title: "Data Structures", studyYear: "Year 2", semesterLabel: "Semester 1", hall: "C-204", studentCount: 35, attendanceRate: 92 },
    { id: 2, moduleId: 12, moduleCode: "CS 2112", title: "Operating Systems", studyYear: "Year 2", semesterLabel: "Semester 1", hall: "D-101", studentCount: 30, attendanceRate: 86 },
    { id: 3, moduleId: 13, moduleCode: "CS 2031", title: "Database Lab", studyYear: "Year 2", semesterLabel: "Semester 1", hall: "Lab 3", studentCount: 24, attendanceRate: 90 },
  ],
  assessments: [
    { assessmentId: 501, offeringId: 1, offeringCode: "CS 2013", title: "ICA 1", type: "ICA", released: "2026-10-04", grade: "A-", comment: "Strong algorithmic reasoning" },
    { assessmentId: 502, offeringId: 2, offeringCode: "CS 2112", title: "Lab Quiz 2", type: "Quiz", released: "2026-10-05", grade: "B+", comment: "Revision needed on scheduling" },
  ],
  results: [
    { resultId: 601, offeringId: 1, offeringCode: "CS 2013", studentName: "A. Perera", registrationNumber: "2024/CS/101", finalGrade: "A", gradePoint: "4.0", status: "PUBLISHED", publishedAt: "2026-10-06" },
    { resultId: 602, offeringId: 1, offeringCode: "CS 2013", studentName: "K. Silva", registrationNumber: "2024/CS/112", finalGrade: "B+", gradePoint: "3.3", status: "PUBLISHED", publishedAt: "2026-10-06" },
    { resultId: 603, offeringId: 2, offeringCode: "CS 2112", studentName: "R. Fernando", registrationNumber: "2024/CS/119", finalGrade: "A-", gradePoint: "3.7", status: "RETURNED", publishedAt: "2026-10-04" },
  ],
};

function getSessionToken() {
  return readStoredSession()?.token || null;
}

function normalizeParams(value) {
  if (typeof value === "string" || typeof value === "number") {
    return { semesterId: value };
  }
  return value || {};
}

function buildQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function toAppError(response, payload) {
  const message = payload?.error?.message || payload?.message || "Request failed.";
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.code || response.status;
  error.details = payload?.error?.details || payload?.details || null;
  return error;
}

async function requestJson(path, { method = "GET", body, params, signal } = {}) {
  const token = getSessionToken();
  const query = buildQueryString(params);
  const headers = new Headers();

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE}${path}${query}`, {
    method,
    headers,
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = toAppError(response, payload);
    if (response.status === 401) {
      clearStoredSession();
    }
    throw error;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload;
  }

  return payload;
}

export async function getLecturerProfile(signal) {
  try {
    return await requestJson("/lecturer/me", { signal });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw error;
    }
    return { data: fallbackProfile };
  }
}

export async function getLecturerSemesters(signal) {
  try {
    return await requestJson("/lecturer/semesters", { signal });
  } catch {
    return { data: [{ id: "semester-1", label: "Semester 1" }, { id: "semester-2", label: "Semester 2" }] };
  }
}

export async function getLecturerDashboard(semesterOrParams = {}, signal) {
  const params = normalizeParams(semesterOrParams);
  try {
    return await requestJson("/lecturer/dashboard", { params, signal });
  } catch {
    return { data: fallbackOverview };
  }
}

export async function getLecturerOfferings(semesterOrParams = {}, signal) {
  const params = normalizeParams(semesterOrParams);
  try {
    return await requestJson("/lecturer/offerings", { params, signal });
  } catch {
    return { data: fallbackOverview.offerings };
  }
}

export async function getLecturerOffering(offeringId, signal) {
  try {
    return await requestJson(`/lecturer/offerings/${encodeURIComponent(offeringId)}`, { signal });
  } catch {
    return {
      data: {
        id: Number(offeringId),
        moduleCode: "CS 2013",
        title: "Data Structures",
        semesterLabel: "Semester 1",
        studyYear: "Year 2",
        hall: "C-204",
        studentCount: 35,
        roster: [
          { id: 1, name: "A. Perera", registrationNumber: "2024/CS/101", attendance: 92, status: "Active" },
          { id: 2, name: "K. Silva", registrationNumber: "2024/CS/112", attendance: 87, status: "Active" },
          { id: 3, name: "R. Fernando", registrationNumber: "2024/CS/119", attendance: 81, status: "Active" },
        ],
        summary: { attendanceRate: 89, pendingResults: 3 },
      },
    };
  }
}

export async function getOfferingStudents(offeringId, params = {}, signal) {
  try {
    return await requestJson(`/lecturer/offerings/${encodeURIComponent(offeringId)}/students`, { params, signal });
  } catch {
    return {
      data: [
        { id: 1, name: "A. Perera", registrationNumber: "2024/CS/101", batch: "2024", attemptNumber: 1, enrollmentStatus: "Completed" },
        { id: 2, name: "K. Silva", registrationNumber: "2024/CS/112", batch: "2024", attemptNumber: 1, enrollmentStatus: "Completed" },
      ],
      meta: { page: 1, totalPages: 1 },
    };
  }
}

export async function getLecturerTimetable(semesterOrParams = {}, signal) {
  const params = normalizeParams(semesterOrParams);
  try {
    return await requestJson("/lecturer/timetable", { params, signal });
  } catch {
    return { data: fallbackOverview.roomSchedule };
  }
}

export async function getLecturerSessions(semesterOrParams = {}, signal) {
  const params = normalizeParams(semesterOrParams);
  try {
    return await requestJson("/lecturer/sessions", { params, signal });
  } catch {
    return { data: fallbackOverview.sessions, meta: { page: 1, totalPages: 1 } };
  }
}

export async function getLecturerSession(sessionId, signal) {
  try {
    return await requestJson(`/lecturer/sessions/${encodeURIComponent(sessionId)}`, { signal });
  } catch {
    return {
      data: {
        id: Number(sessionId),
        title: "Lecture 01",
        date: "2026-10-08",
        startTime: "09:00",
        endTime: "10:30",
        location: "C-204",
        status: "Scheduled",
        attendance: [{ id: 1, name: "A. Perera", registrationNumber: "2024/CS/101", status: "present" }],
      },
    };
  }
}

export async function getSessionAttendance(sessionId, signal) {
  try {
    return await requestJson(`/lecturer/sessions/${encodeURIComponent(sessionId)}/attendance`, { signal });
  } catch {
    return { data: [{ id: 1, name: "A. Perera", registrationNumber: "2024/CS/101", status: "present", scanTime: "09:08:42" }] };
  }
}

export async function openLectureSession(payload, signal) {
  return requestJson("/lecturer/sessions", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function closeLectureSession(sessionId, signal) {
  return requestJson(`/lecturer/sessions/${encodeURIComponent(sessionId)}/close`, {
    method: "POST",
    signal,
  });
}

export async function getOfferingAssessments(offeringId, params = {}, signal) {
  try {
    return await requestJson(`/lecturer/offerings/${encodeURIComponent(offeringId)}/assessments`, { params, signal });
  } catch {
    return { data: fallbackOverview.assessments.filter((item) => item.offeringId === Number(offeringId)) || [] };
  }
}

export async function getOfferingResults(offeringId, params = {}, signal) {
  try {
    return await requestJson(`/lecturer/offerings/${encodeURIComponent(offeringId)}/results`, { params, signal });
  } catch {
    return { data: fallbackOverview.results.filter((item) => item.offeringId === Number(offeringId)) || [] };
  }
}

export async function getLecturerResult(resultId, signal) {
  try {
    return await requestJson(`/lecturer/results/${encodeURIComponent(resultId)}`, { signal });
  } catch {
    return {
      data: {
        id: Number(resultId),
        studentName: "A. Perera",
        registrationNumber: "2024/CS/101",
        examType: "Final exam",
        examDate: "2026-10-05",
        examGrade: "A",
        finalGrade: "A",
        status: "PUBLISHED",
        publishedAt: "2026-10-06T10:00:00+05:30",
      },
    };
  }
}

export async function getLecturerOverview(semesterId, signal) {
  return getLecturerDashboard(semesterId, signal);
}

export async function getLecturerResultHistory(resultId, signal) {
  try {
    return await requestJson(`/lecturer/results/${encodeURIComponent(resultId)}/history`, { signal });
  } catch {
    return { data: [{ id: 1, action: "Published", by: "Academic office", at: "2026-10-06T10:00:00+05:30" }] };
  }
}

export const getLecturerMe = getLecturerProfile;
export const getLecturerOfferingDetails = getLecturerOffering;
export const getLecturerAssessments = async (semesterId, signal) => {
  const semester = typeof semesterId === "string" || typeof semesterId === "number" ? { semesterId } : semesterId || {};
  const { data } = await getOfferingAssessments(1, semester, signal);
  return data;
};
export const getLecturerResults = async (semesterId, signal) => {
  const semester = typeof semesterId === "string" || typeof semesterId === "number" ? { semesterId } : semesterId || {};
  const { data } = await getOfferingResults(1, semester, signal);
  return data;
};
export const getLecturerSessionDetails = getLecturerSession;

export { API_BASE };
