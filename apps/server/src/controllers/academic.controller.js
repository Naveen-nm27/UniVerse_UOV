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
} from "../services/academic.service.js";

export async function listDepartments(req, res, next) {
  try {
    const data = await getDepartments();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addDepartment(req, res, next) {
  try {
    const data = await createDepartment(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listProgrammes(req, res, next) {
  try {
    const data = await getProgrammes();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addProgramme(req, res, next) {
  try {
    const data = await createProgramme(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listBatches(req, res, next) {
  try {
    const data = await getBatches();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addBatch(req, res, next) {
  try {
    const data = await createBatch(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listCalendarSemesters(req, res, next) {
  try {
    const data = await getCalendarSemesters();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addCalendarSemester(req, res, next) {
  try {
    const data =
      await createCalendarSemester(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listProgrammeSemesters(req, res, next) {
  try {
    const data =
      await getProgrammeSemesters();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addProgrammeSemester(req, res, next) {
  try {
    const data =
      await createProgrammeSemester(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listModules(req, res, next) {
  try {
    const data = await getModules();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addModule(req, res, next) {
  try {
    const data = await createModule(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listHalls(req, res, next) {
  try {
    const data = await getHalls();

    res.status(200).json({
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addHall(req, res, next) {
  try {
    const data = await createHall(req.body);

    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
}