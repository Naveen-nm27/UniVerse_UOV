import { apiRequest, apiDownload, queryString } from "./client";
export async function getStudentDashboard(semesterId, options) { return (await apiRequest(`/student/dashboard${queryString({ semesterId })}`, options)).data; }
export async function getStudentResults(semesterId, options) { return (await apiRequest(`/student/results${queryString({ semesterId })}`, options)).data; }
export async function getStudentAssessments(semesterId, options) { return (await apiRequest(`/student/assessments${queryString({ semesterId })}`, options)).data; }
export async function getStudentResultDetails(id, options) { return (await apiRequest(`/student/results/${encodeURIComponent(id)}`, options)).data; }
export function downloadStudentResults(semesterId) { return apiDownload(`/student/downloads/result-summary${queryString({ semesterId })}`); }
