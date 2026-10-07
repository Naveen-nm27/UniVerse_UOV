import { readStoredSession } from "../auth/session";

const API_BASE = "http://localhost:4000/api";

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
    { resultId: 601, offeringId: 1, offeringCode: "CS 2013", studentName: "A. Perera", registrationNumber: "2024/CS/101", finalGrade: "A", gradePoint: "4.0", status: "Published", publishedAt: "2026-10-06" },
    { resultId: 602, offeringId: 1, offeringCode: "CS 2013", studentName: "K. Silva", registrationNumber: "2024/CS/112", finalGrade: "B+", gradePoint: "3.3", status: "Published", publishedAt: "2026-10-06" },
    { resultId: 603, offeringId: 2, offeringCode: "CS 2112", studentName: "R. Fernando", registrationNumber: "2024/CS/119", finalGrade: "A-", gradePoint: "3.7", status: "Return to student", publishedAt: "2026-10-04" },
  ],
  profile: {
    id: 41,
    email: "lecturer@example.test",
    fullName: "Dr. N. Gunaratne",
    role: "LECTURER",
    department: "Computer Science",
    title: "Senior Lecturer",
    office: "Faculty of Computing",
    status: "Active",
  },
};

function buildHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getSessionToken() {
  return readStoredSession()?.token || null;
}

async function requestJson(path, { method = "GET", body } = {}) {
  const token = getSessionToken();
  const headers = { "Content-Type": "application/json", ...buildHeaders(token) };
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data?.error?.message || data?.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  return data.data ?? data;
}

export async function getLecturerMe() {
  try {
    return await requestJson("/lecturer/me");
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw error;
    }
    return fallbackOverview.profile;
  }
}

export async function getLecturerOverview(semesterId) {
  try {
    const data = await requestJson(`/lecturer/overview${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview;
  }
}

export async function getLecturerOfferings(semesterId) {
  try {
    const data = await requestJson(`/lecturer/modules${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview.offerings;
  }
}

export async function getLecturerOfferingDetails(offeringId) {
  try {
    const data = await requestJson(`/lecturer/modules/${encodeURIComponent(offeringId)}`);
    return data;
  } catch {
    return {
      id: Number(offeringId),
      moduleCode: "CS 2013",
      title: "Data Structures",
      semesterLabel: "Semester 1",
      studyYear: "Year 2",
      hall: "C-204",
      studentCount: 35,
      roster: [
        { id: 1, name: "A. Perera", registration: "2024/CS/101", attendance: 92 },
        { id: 2, name: "K. Silva", registration: "2024/CS/112", attendance: 87 },
        { id: 3, name: "R. Fernando", registration: "2024/CS/119", attendance: 81 },
      ],
      summary: { attendanceRate: 89, pendingResults: 3 },
    };
  }
}

export async function getLecturerTimetable(semesterId) {
  try {
    const data = await requestJson(`/lecturer/timetable${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview.roomSchedule;
  }
}

export async function getLecturerSessions(semesterId) {
  try {
    const data = await requestJson(`/lecturer/sessions${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview.sessions;
  }
}

export async function getLecturerSessionDetails(sessionId) {
  try {
    const data = await requestJson(`/lecturer/sessions/${encodeURIComponent(sessionId)}`);
    return data;
  } catch {
    return {
      id: Number(sessionId),
      title: "Lecture 01",
      date: "2026-10-08",
      startTime: "09:00",
      endTime: "10:30",
      location: "C-204",
      status: "Scheduled",
      attendance: [
        { id: 1, name: "A. Perera", registration: "2024/CS/101", status: "Present" },
        { id: 2, name: "K. Silva", registration: "2024/CS/112", status: "Present" },
        { id: 3, name: "R. Fernando", registration: "2024/CS/119", status: "Late" },
      ],
    };
  }
}

export async function getLecturerAssessments(semesterId) {
  try {
    const data = await requestJson(`/lecturer/assessments${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview.assessments;
  }
}

export async function getLecturerResults(semesterId) {
  try {
    const data = await requestJson(`/lecturer/results${semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ""}`);
    return data;
  } catch {
    return fallbackOverview.results;
  }
}

export async function getLecturerResultHistory(resultId) {
  try {
    const data = await requestJson(`/lecturer/results/${encodeURIComponent(resultId)}/history`);
    return data;
  } catch {
    return [
      { id: 1, action: "Published", by: "Academic office", at: "2026-10-06" },
      { id: 2, action: "Validated", by: "Management assistant", at: "2026-10-05" },
    ];
  }
}
