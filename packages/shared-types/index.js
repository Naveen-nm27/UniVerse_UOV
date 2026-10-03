/** @typedef {"STUDENT" | "LECTURER" | "HOD" | "DEAN" | "MA" | "ADMIN"} UserRole */
/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} fullName
 * @property {UserRole} role
 * @property {string} dashboardPath
 * @property {boolean} mustChangePassword
 */
export function isStudent(user) { return user?.role === "STUDENT"; }
export function isLecturer(user) { return ["LECTURER", "HOD"].includes(user?.role); }
export function isAdministrator(user) { return user?.role === "ADMIN"; }
export function isManagementAssistant(user) { return user?.role === "MA"; }
