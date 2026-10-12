import { apiRequest } from "./client";

export function loginUser({ email, password, signal }) {
  return apiRequest("/users/login", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), password },
    signal,
  });
}
