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

export function isStudent(user) {
  return user.role === "student";
}

export function isLecturer(user) {
  return user.role === "lecturer";
}

export function isAdministrator(user) {
  return user.role === "administrator";
}

export function isManagementAssistant(user) {
  return user.role === "management_assistant";
}
