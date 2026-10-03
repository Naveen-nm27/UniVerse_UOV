import { Router } from "express";
import { login, register, list, updateStatus, changePassword } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, studentSchema, userQuerySchema, passwordSchema, positiveId } from "@universe/shared-validation";
import { z } from "zod";
const router = Router();
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, (req, res) => res.json({ data: req.user }));
router.post("/password", authenticate, validate(passwordSchema), changePassword);
router.use(authenticate, requireRole("MA"));
router.get("/", validate(userQuerySchema, "query"), list);
router.post(["/", "/register"], validate(studentSchema), register);
router.patch("/:userId/status", validate(z.object({ userId: positiveId }).strict(), "params"),
  validate(z.object({ isActive: z.boolean() }).strict()), updateStatus);
export default router;
