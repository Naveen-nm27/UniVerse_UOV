import {
  getRoles,
  getDepartments,
  getProgrammes,
  getBatches,
  getGradeScale,
} from "../services/ma-lookups.service.js";

export async function roles(req, res) {
  try {
    const data = await getRoles();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load roles",
    });
  }
}

export async function departments(req, res) {
  try {
    const data = await getDepartments();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load departments",
    });
  }
}

export async function programmes(req, res) {
  try {
    const data = await getProgrammes();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load programmes",
    });
  }
}

export async function batches(req, res) {
  try {
    const data = await getBatches();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load batches",
    });
  }
}

export async function gradeScale(req, res) {
  try {
    const data = await getGradeScale();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Unable to load grade scale",
    });
  }
}