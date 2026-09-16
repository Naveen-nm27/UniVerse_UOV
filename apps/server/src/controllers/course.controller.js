import { createCourse, getAllCourses } from "../services/course.service.js";

export async function create(req, res) {
  const course = await createCourse(req.body);
  res.status(201).json(course);
}

export async function getAll(req, res) {
  const courses = await getAllCourses();
  res.json(courses);
}