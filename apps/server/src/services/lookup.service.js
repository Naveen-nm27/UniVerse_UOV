import { AppDataSource } from "../data-source.js";

export async function getRoles() {
  return AppDataSource
    .getRepository("Role")
    .find({
      order: {
        id: "ASC",
      },
    });
}

export async function getDepartments() {
  return AppDataSource
    .getRepository("Department")
    .find({
      order: {
        id: "ASC",
      },
    });
}

export async function getProgrammes() {
  return AppDataSource
    .getRepository("Programme")
    .find({
      order: {
        id: "ASC",
      },
    });
}

export async function getBatches() {
  return AppDataSource
    .getRepository("Batch")
    .find({
      order: {
        id: "ASC",
      },
    });
}

export async function getGradeScale() {
  return AppDataSource
    .getRepository("GradeScale")
    .find({
      order: {
        id: "ASC",
      },
    });
}