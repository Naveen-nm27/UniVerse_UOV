const API_BASE = "http://localhost:4000/api";

export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/courses`);
  return res.json();
}

export async function addCourse(data) {
  const res = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}