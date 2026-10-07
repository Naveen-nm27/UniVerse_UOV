/**
 * @typedef {"student" | "lecturer" | "administrator" | "management_assistant"} UserRole
 */

/**
 * @typedef {Object} BaseUser
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} passwordHash
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {BaseUser & {
 *   role: "student",
 *   studentNumber: string,
 *   programmeId: string,
 *   batchId: string
 * }} Student
 */

/**
 * @typedef {BaseUser & {
 *   role: "lecturer",
 *   departmentId: string,
 *   isHOD: boolean
 * }} Lecturer
 */

/**
 * @typedef {BaseUser & { role: "administrator" }} Administrator
 */

/**
 * @typedef {BaseUser & { role: "management_assistant" }} ManagementAssistant
 */

/**
 * @typedef {Student | Lecturer | Administrator | ManagementAssistant} User
 */

/**
 * @typedef {Object} LecturerProfileDto
 * @property {number} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} role
 * @property {string|null} department
 * @property {string|null} title
 * @property {string|null} office
 * @property {string|null} status
 */

/**
 * @typedef {Object} LecturerOfferingDto
 * @property {number} id
 * @property {number} moduleId
 * @property {string} moduleCode
 * @property {string} title
 * @property {string} studyYear
 * @property {string} semesterLabel
 * @property {string|null} hall
 * @property {number} studentCount
 * @property {number|null} attendanceRate
 */

/**
 * @typedef {Object} LecturerSessionDto
 * @property {number} id
 * @property {number} offeringId
 * @property {string} title
 * @property {string} date
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} location
 * @property {string} status
 * @property {number} attendanceCount
 * @property {number} enrolledCount
 */

/**
 * @typedef {Object} LecturerAssessmentDto
 * @property {number} assessmentId
 * @property {number} offeringId
 * @property {string} offeringCode
 * @property {string} title
 * @property {string} type
 * @property {string} released
 * @property {string} grade
 * @property {string|null} comment
 */

/**
 * @typedef {Object} LecturerResultDto
 * @property {number} resultId
 * @property {number} offeringId
 * @property {string} offeringCode
 * @property {string} studentName
 * @property {string} registrationNumber
 * @property {string} finalGrade
 * @property {string|null} gradePoint
 * @property {string} status
 * @property {string} publishedAt
 */

export function isStudent(user) {
  return user?.role === "student";
}

export function isLecturer(user) {
  return user?.role === "lecturer";
}

export function isAdministrator(user) {
  return user?.role === "administrator";
}

export function isManagementAssistant(user) {
  return user?.role === "management_assistant";
}
