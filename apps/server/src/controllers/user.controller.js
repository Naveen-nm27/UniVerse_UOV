import { registerUser } from "../services/user.service.js";

export async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentNumber: user.studentNumber,
    });
  } catch (err) {
    const isValidationError = err?.name === "ZodError";
    const message = isValidationError
      ? err.issues?.[0]?.message || "Please check your registration details"
      : err.message;
    res.status(400).json({ error: message });
  }
}