import { AppDataSource } from "../data-source.js";

function getRepository(name) {
  return AppDataSource.getRepository(name);
}

export async function getDepartments() {
  return getRepository("Department").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createDepartment(data) {
  const repository = getRepository("Department");

  const department = repository.create({
    name: data.name,
    code: data.code,
    description: data.description || null,
  });

  return repository.save(department);
}

export async function getProgrammes() {
  return getRepository("Programme").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createProgramme(data) {
  const repository = getRepository("Programme");

  const programme = repository.create({
    name: data.name,
    code: data.code,
    departmentId: data.departmentId,
  });

  return repository.save(programme);
}

export async function getBatches() {
  return getRepository("Batch").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createBatch(data) {
  const repository = getRepository("Batch");

  const batch = repository.create({
    name: data.name,
    year: data.year,
    programmeId: data.programmeId,
  });

  return repository.save(batch);
}

export async function getCalendarSemesters() {
  return getRepository("CalendarSemester").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createCalendarSemester(data) {
  const repository =
    getRepository("CalendarSemester");

  const semester = repository.create({
    name: data.name,
    year: data.year,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
  });

  return repository.save(semester);
}

export async function getProgrammeSemesters() {
  return getRepository("ProgrammeSemester").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createProgrammeSemester(data) {
  const repository =
    getRepository("ProgrammeSemester");

  const item = repository.create({
    programmeId: data.programmeId,
    semesterId: data.semesterId,
    semesterNumber: data.semesterNumber,
  });

  return repository.save(item);
}

export async function getModules() {
  return getRepository("Module").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createModule(data) {
  const repository = getRepository("Module");

  const item = repository.create({
    code: data.code,
    name: data.name,
    credits: data.credits,
    departmentId: data.departmentId || null,
  });

  return repository.save(item);
}

export async function getHalls() {
  return getRepository("Hall").find({
    order: {
      id: "ASC",
    },
  });
}

export async function createHall(data) {
  const repository = getRepository("Hall");

  const hall = repository.create({
    name: data.name,
    capacity: data.capacity,
    location: data.location || null,
  });

  return repository.save(hall);
}