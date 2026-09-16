import { useEffect, useState } from "react";
import { fetchCourses, addCourse } from "../api/courses";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("");

  async function loadCourses() {
    const data = await fetchCourses();
    setCourses(data);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await addCourse({ code, title, credits: Number(credits) });
    setCode("");
    setTitle("");
    setCredits("");
    loadCourses();
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Credits" value={credits} onChange={(e) => setCredits(e.target.value)} />
        <button type="submit">Add Course</button>
      </form>

      <ul>
        {courses.map((c) => (
          <li key={c.id}>{c.code} — {c.title} ({c.credits} credits)</li>
        ))}
      </ul>
    </div>
  );
}