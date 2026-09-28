import {
  getDepartments,
  createDepartment,
  getProgrammes,
  createProgramme,
  getBatches,
  createBatch,
  getCalendarSemesters,
  createCalendarSemester,
  getProgrammeSemesters,
  createProgrammeSemester,
  getModules,
  createModule,
  getHalls,
  createHall,
} from "../services/ma-academic.service.js";

export async function listDepartments(req, res) {
  try {
    const data = await getDepartments();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load departments",
    });
  }
}

export async function addDepartment(req, res) {
  try {
    const data = await createDepartment(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create department",
    });
  }
}

export async function listProgrammes(req, res) {
  try {
    const data = await getProgrammes();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load programmes",
    });
  }
}

export async function addProgramme(req, res) {
  try {
    const data = await createProgramme(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create programme",
    });
  }
}

export async function listBatches(req, res) {
  try {
    const data = await getBatches();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load batches",
    });
  }
}

export async function addBatch(req, res) {
  try {
    const data = await createBatch(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create batch",
    });
  }
}

export async function listCalendarSemesters(req, res) {
  try {
    const data = await getCalendarSemesters();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load semesters",
    });
  }
}

export async function addCalendarSemester(req, res) {
  try {
    const data = await createCalendarSemester(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create semester",
    });
  }
}

export async function listProgrammeSemesters(req, res) {
  try {
    const data = await getProgrammeSemesters();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load programme semesters",
    });
  }
}

export async function addProgrammeSemester(req, res) {
  try {
    const data = await createProgrammeSemester(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create programme semester",
    });
  }
}

export async function listModules(req, res) {
  try {
    const data = await getModules();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load modules",
    });
  }
}

export async function addModule(req, res) {
  try {
    const data = await createModule(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create module",
    });
  }
}

export async function listHalls(req, res) {
  try {
    const data = await getHalls();

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load halls",
    });
  }
}

export async function addHall(req, res) {
  try {
    const data = await createHall(
      req.body,
      req.auth.userId
    );

    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({
      error: err.message || "Unable to create hall",
    });
  }
}