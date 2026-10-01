import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AppDataSource } from "./data-source.js";

const frontendRoleMap = {
  STUDENT: "student",
  LECTURER: "lecturer",
  HOD: "hod",
  DEAN: "dean",
  MA: "management_assistant",
  ADMIN: "administrator",
};

const dashboardPathMap = {
  STUDENT: "/student",
  LECTURER: "/lecturer",
  HOD: "/hod",
  DEAN: "/dean",
  MA: "/ma",
  ADMIN: "/admin",
};

export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error(
      "Email and password are required."
    );
  }

  const secret =
    process.env.JWT_SECRET ||
    "development-only-secret-change-me";

  const userRepository =
    AppDataSource.getRepository("User");

  const user = await userRepository.findOne({
    where: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!user) {
    throw new Error(
      "Invalid email or password."
    );
  }

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password."
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive."
    );
  }

  const normalizedRole =
    String(user.role || "student").toUpperCase();

  const role =
    frontendRoleMap[normalizedRole] ||
    "student";

  const token = jwt.sign(
    {
      sub: String(user.id),
      role: normalizedRole,
    },
    secret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "8h",
    }
  );

  return {
    token,

    user: {
      id: user.id,
      email: user.email,
      fullName:
        `${user.firstName} ${user.lastName}`.trim(),
      role,
      roleCode: normalizedRole,
      dashboardPath:
        dashboardPathMap[normalizedRole] ||
        "/student",
      permissions: [],
    },
  };
}