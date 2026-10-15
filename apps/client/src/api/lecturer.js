import { apiRequest, queryString } from "./client";
// Preserve API errors and cancellation. Only the server supplies academic records.
export const getLecturerProfile = (signal) => apiRequest("/lecturer/me", { signal });
export const getLecturerSemesters = (signal) => apiRequest("/lecturer/semesters", { signal });
export const getLecturerDashboard = (params, signal) =>
  apiRequest("/lecturer/dashboard" + queryString(params), { signal });
