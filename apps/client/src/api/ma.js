import { apiRequest, queryString } from "./client";
export async function getMaDashboard(options) { return (await apiRequest("/ma/dashboard", options)).data; }
export async function getAcademicResources(options) { return (await apiRequest("/ma/academic/resources", options)).data; }
export function getAcademic(key, page, options) { return apiRequest(`/ma/academic/${encodeURIComponent(key)}${queryString({ page, pageSize: 25 })}`, options); }
export async function saveAcademic(key, body, id) {
  return (await apiRequest(`/ma/academic/${encodeURIComponent(key)}${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body })).data;
}
export async function getLookup(key, options) { return (await apiRequest(`/ma/lookups/${encodeURIComponent(key)}`, options)).data; }
