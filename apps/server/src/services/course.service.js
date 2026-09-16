import { AppDataSource } from "../data-source.js";
import { Course } from "../entities/Course.js";

export async function createCourse(data) {
  const repo = AppDataSource.getRepository(Course);
  const course = repo.create(data);
  return repo.save(course);
}

export async function getAllCourses() {
  const repo = AppDataSource.getRepository(Course);
  return repo.find();
}