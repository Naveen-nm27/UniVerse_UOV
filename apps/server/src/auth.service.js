import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AppDataSource } from "./data-source.js";

/*
 * V04 role codes
 *
 * These are the backend role codes.
 *
 * The frontend may currently use different names.
 */
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
    throw new Error("Email and password are required.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userRepository = AppDataSource.getRepository("User");

  const user = await userRepository.findOne({
    where: {
      email: normalizedEmail,
    },

    relations: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash =
    user.passwordHash ||
    user.password_hash;

  if (!passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  if (user.active === false) {
    throw new Error("Your account is inactive.");
  }

  const roleCode =
    user.role?.code ||
    user.role?.roleCode ||
    user.role_code ||
    user.role;

  if (!roleCode) {
    throw new Error(
      "Your account role is not configured."
    );
  }

  const normalizedRole =
    String(roleCode).toUpperCase();

  if (!frontendRoleMap[normalizedRole]) {
    throw new Error(
      "Your account role is not supported."
    );
  }

  /*
   * JWT contains only stable identity.
   */
  const token = jwt.sign(
    {
      sub: String(user.id),
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "1h",
    }
  );

  /*
   * Temporary permissions.
   *
   * Replace this with V04 permission lookup
   * after the actual SQL schema is mapped.
   */
  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  return {
    token,

    user: {
      id: user.id,

      email: user.email,

      fullName:
        user.fullName ||
        user.full_name ||
        user.name ||
        "",

      /*
       * Current frontend-compatible role.
       */
      role: frontendRoleMap[normalizedRole],

      /*
       * Backend/V04 role.
       */
      roleCode: normalizedRole,

      dashboardPath:
        dashboardPathMap[normalizedRole],

      officeName:
        user.officeName ||
        user.office_name ||
        "",

      permissions,
    },
  };
}