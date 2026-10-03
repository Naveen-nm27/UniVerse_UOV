import * as users from "../services/user.service.js";
export async function login(req, res) {
  res.json(await users.loginUser(req.validated.email, req.validated.password));
}
export async function list(req, res) { res.json(await users.listUsers(req.validated)); }
export async function register(req, res) {
  res.status(201).json({ data: await users.createStudent(req.validated, req.auth.userId) });
}
export async function updateStatus(req, res) {
  res.json({ data: await users.setUserActive(Number(req.params.userId), req.validated.isActive, req.auth.userId) });
}
export async function changePassword(req, res) {
  await users.changePassword(req.auth.userId, req.validated.currentPassword, req.validated.password);
  res.json({ data: { mustChangePassword: false } });
}
