import { apiRequest, queryString } from "./client";
export function loginUser({ email, password }) {
  return apiRequest("/users/login", { method: "POST", auth: false, body: { email: email.trim().toLowerCase(), password } });
}
export function getUsers(query, options) { return apiRequest(`/users${queryString(query)}`, options); }
export async function createUser(input) { return (await apiRequest("/users", { method: "POST", body: input })).data; }
export async function setUserActive(id, isActive) { return (await apiRequest(`/users/${id}/status`, { method: "PATCH", body: { isActive } })).data; }
export async function changePassword(currentPassword, password) {
  return (await apiRequest("/users/password", { method: "POST", body: { currentPassword, password } })).data;
}
