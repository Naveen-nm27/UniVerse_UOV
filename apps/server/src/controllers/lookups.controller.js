import {
  getRoles,
  getDepartments,
  getProgrammes,
  getBatches,
  getGradeScale,
} from "../services/lookup.service.js";

export async function roles(req, res, next) {
  try {
    const data = await getRoles();

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

export async function departments(req, res, next) {
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

export async function programmes(req, res, next) {
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

export async function batches(req, res, next) {
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

export async function gradeScale(req, res, next) {
  try {
    const data = await getGradeScale();

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