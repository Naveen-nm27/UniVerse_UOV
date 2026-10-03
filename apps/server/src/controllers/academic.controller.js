import { getAcademicResources, listAcademic, saveAcademic } from "../services/academic.service.js";
export async function catalog(req, res) { res.json({ data: await getAcademicResources() }); }
export async function list(req, res) { res.json(await listAcademic(req.params.resource, req.validated)); }
export async function create(req, res) { res.status(201).json({ data: await saveAcademic(req.params.resource, req.body) }); }
export async function update(req, res) { res.json({ data: await saveAcademic(req.params.resource, req.body, req.validated.id) }); }
