import { AppDataSource } from "../data-source.js";
import { requireTable } from "./schema.service.js";
async function lookup(table, entity, id, label) {
  await requireTable(table);
  const rows = await AppDataSource.getRepository(entity).find({ select: [id, label], order: { [id]: "ASC" } });
  return rows.map((row) => ({ id: row[id], label: row[label] }));
}
export const getRoles = async () => {
  await requireTable("ROLES");
  return AppDataSource.getRepository("Role").find({ order: { roleCode: "ASC" } });
};
export const getDepartments = () => lookup("DEPARTMENTS", "Department", "departmentId", "departmentName");
export const getProgrammes = () => lookup("PROGRAMMES", "Programme", "programmeId", "programmeName");
export const getBatches = () => lookup("BATCHES", "Batch", "batchId", "batchName");
export const getGradeScale = () => {
  return AppDataSource.getRepository("GradeScale").find({ order: { gradePoint: "DESC" } });
};
