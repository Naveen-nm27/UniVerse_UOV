import {
  loginUser,
} from "../auth.service.js";

import {
  registerUser,
} from "../services/user.service.js";

export async function register(req, res, next) {
  try {
    const user =
      await registerUser(req.body);

    return res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentNumber:
          user.studentNumber,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    const result =
      await loginUser(
        email,
        password
      );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message:
          error.message ||
          "Unable to sign in.",
      },
    });
  }
}