const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/+$/, "");
let authToken = null;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function setAuthToken(token) {
  authToken = token || null;
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (authToken) requestHeaders.set("Authorization", "Bearer " + authToken);

  let response;
  try {
    const url = new URL(path.replace(/^\/+/, ""), `${API_BASE_URL}/`);
    response = await fetch(url, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("The server could not be reached. Check your connection and try again.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (response.ok && response.status !== 204) {
      throw new Error("The server returned an invalid response.");
    }
  }
  if (!response.ok) {
    const messages = {
      401: "Your session is no longer valid. Please sign in again.",
      403: "You do not have permission to perform this action.",
      404: "This service is not available in the current server.",
      409: "The request conflicts with the current server state.",
      400: "The server rejected the submitted values. Check the form and try again.",
      422: "The submitted values did not pass server validation.",
    };
    const message = payload?.error || payload?.message || messages[response.status] || `The server returned an error (${response.status}).`;
    if (response.status === 401) window.dispatchEvent(new Event("universe:unauthorized"));
    throw new ApiError(response.status, message);
  }
  return payload;
}
