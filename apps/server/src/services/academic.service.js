import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { positiveId, date } from "@universe/shared-validation";
import { ApiError } from "../utils/api-error.js";
import { getSchema, requireTable } from "./schema.service.js";
import { appendAuditLog } from "./audit.service.js";
const text = (max) => z.string().trim().min(1).max(max);
const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  required: true,
  ...extra,
});
export const resources = {
  departments: {
    entity: "Department",
    table: "DEPARTMENTS",
    id: "departmentId",
    label: "Departments",
    fields: [
      field("departmentName", "Department name", "text", { max: 255 }),
      field("departmentCode", "Department code", "text", { max: 20 }),
    ],
    schema: z.object({ departmentName: text(255), departmentCode: text(20) }).strict(),
  },
  programmes: {
    entity: "Programme",
    table: "PROGRAMMES",
    id: "programmeId",
    label: "Programmes",
    fields: [
      field("programmeCode", "Code", "text", { max: 20 }),
      field("programmeName", "Programme name", "text", { max: 255 }),
      field("departmentId", "Department", "select", { reference: "departments" }),
      field("durationYears", "Duration in years", "number", { min: 1, max: 10 }),
    ],
    schema: z
      .object({
        programmeCode: text(20),
        programmeName: text(255),
        departmentId: positiveId,
        durationYears: z.coerce.number().int().min(1).max(10),
      })
      .strict(),
  },
  batches: {
    entity: "Batch",
    table: "BATCHES",
    id: "batchId",
    label: "Batches",
    fields: [
      field("batchName", "Batch name", "text", { max: 100 }),
      field("startDate", "Start date", "date"),
    ],
    schema: z.object({ batchName: text(100), startDate: date }).strict(),
  },
  "calendar-semesters": {
    entity: "Semester",
    table: "SEMESTERS",
    id: "semesterId",
    label: "Calendar semesters",
    fields: [
      field("semesterName", "Semester name", "text", { max: 50 }),
      field("academicYear", "Academic year", "text", { max: 20 }),
      field("startDate", "Start date", "date"),
      field("endDate", "End date", "date"),
    ],
    schema: z
      .object({ semesterName: text(50), academicYear: text(20), startDate: date, endDate: date })
      .strict()
      .refine((data) => data.endDate >= data.startDate, {
        path: ["endDate"],
        message: "End date must follow the start date",
      }),
  },
  modules: {
    entity: "Module",
    table: "MODULES",
    id: "moduleId",
    label: "Modules",
    fields: [
      field("moduleCode", "Code"),
      field("moduleName", "Module name"),
      field("credits", "Credits", "number", { min: 1, max: 255 }),
      field("programmeSemesterId", "Programme semester", "select", {
        reference: "programme-semesters",
      }),
    ],
    schema: z
      .object({
        moduleCode: text(20),
        moduleName: text(255),
        credits: z.coerce.number().int().min(1).max(255),
        programmeSemesterId: positiveId,
      })
      .strict(),
  },
  "programme-semesters": {
    entity: "ProgrammeSemester",
    table: "PROGRAMME_SEMESTERS",
    id: "programmeSemesterId",
    label: "Programme semesters",
    fields: [
      field("programmeId", "Programme", "select", { reference: "programmes" }),
      field("semesterNumber", "Semester number", "number", { min: 1, max: 20 }),
      field("name", "Name"),
    ],
    schema: z
      .object({
        programmeId: positiveId,
        semesterNumber: z.coerce.number().int().min(1).max(20),
        name: text(100),
      })
      .strict(),
  },
  halls: {
    entity: "Hall",
    table: "HALLS",
    id: "hallId",
    label: "Halls",
    fields: [
      field("hallName", "Hall name"),
      field("capacity", "Capacity", "number", { required: false, min: 1, max: 65535 }),
    ],
    schema: z
      .object({
        hallName: text(100),
        capacity: z.coerce.number().int().min(1).max(65535).nullable().optional(),
      })
      .strict(),
  },
};
export function resourceFor(key) {
  const resource = resources[key];
  if (!resource) throw new ApiError(404, "NOT_FOUND", "Academic resource not found.");
  return resource;
}
export async function getAcademicResources() {
  const tables = await getSchema();
  return Object.entries(resources).map(([key, r]) => ({
    key,
    label: r.label,
    id: r.id,
    fields: r.fields,
    available: Boolean(r.table && tables.has(r.table)),
    writable: Boolean(r.schema && r.table && tables.has(r.table)),
    unavailableReason:
      r.writable === false
        ? "This operation requires the complete academic database schema."
        : null,
  }));
}
export async function listAcademic(key, query = {}) {
  const r = resourceFor(key);
  if (!r.table)
    throw new ApiError(
      503,
      "SCHEMA_UNAVAILABLE",
      "This feature requires the complete academic database schema.",
    );
  await requireTable(r.table);
  const { page = 1, pageSize = 25 } = query;
  const [data, total] = await AppDataSource.getRepository(r.entity).findAndCount({
    order: { [r.id]: "ASC" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { data, meta: { page, pageSize, total, count: data.length } };
}
export async function saveAcademic(key, input, id = null, actorId) {
  const r = resourceFor(key);
  if (!r.schema)
    throw new ApiError(
      503,
      "SCHEMA_UNAVAILABLE",
      "This operation requires the complete academic database schema.",
    );
  await requireTable(r.table);
  const data = r.schema.parse(input);
  return AppDataSource.transaction(async (manager) => {
    if (!(await manager.getRepository("MaStaff").existsBy({ userId: actorId })))
      throw new ApiError(403, "MA_PROFILE_REQUIRED", "A Management Assistant profile is required.");
    const repo = manager.getRepository(r.entity);
    if (
      data.departmentId &&
      !(await manager.getRepository("Department").existsBy({ departmentId: data.departmentId }))
    )
      throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing department.");
    if (data.programmeId) {
      const programme = await manager
        .getRepository("Programme")
        .findOneBy({ programmeId: data.programmeId });
      if (!programme) throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing programme.");
      if (data.semesterNumber > programme.durationYears * 2)
        throw new ApiError(400, "INVALID_SEMESTER", "The semester exceeds the programme duration.");
    }
    if (
      data.programmeSemesterId &&
      !(await manager
        .getRepository("ProgrammeSemester")
        .existsBy({ programmeSemesterId: data.programmeSemesterId }))
    )
      throw new ApiError(400, "INVALID_REFERENCE", "Choose an existing programme semester.");
    if (id && !(await repo.existsBy({ [r.id]: id })))
      throw new ApiError(404, "NOT_FOUND", "Record not found.");
    const before = id ? await repo.findOneBy({ [r.id]: id }) : null;
    if (
      before &&
      key === "modules" &&
      (before.credits !== data.credits || before.programmeSemesterId !== data.programmeSemesterId)
    ) {
      const published = await manager.query(
        `SELECT fr.result_id FROM FINAL_RESULTS fr
        JOIN ENROLLMENTS e ON e.enrollment_id=fr.enrollment_id JOIN MODULE_OFFERINGS mo ON mo.offering_id=e.offering_id
        WHERE mo.module_id=? AND fr.status='PUBLISHED' LIMIT 1`,
        [id],
      );
      if (published.length)
        throw new ApiError(
          409,
          "PUBLISHED_CURRICULUM_LOCKED",
          "Credit and curriculum changes require a reviewed migration after results are published.",
        );
    }
    const saved = await repo.save(repo.create({ ...data, ...(id ? { [r.id]: id } : {}) }));
    await appendAuditLog(
      manager,
      r.table,
      saved[r.id],
      id ? "UPDATE" : "INSERT",
      actorId,
      before,
      data,
    );
    return saved;
  });
}
