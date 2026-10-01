import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AppDataSource } from "../data-source.js";
import { User } from "../entities/User.js";

export async function registerUser(input) {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
  } = input;

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName
  ) {
    throw new Error(
      "Email, password, first name and last name are required."
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const repository =
    AppDataSource.getRepository(User);

  const existing =
    await repository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

  if (existing) {
    throw new Error(
      "Email already registered."
    );
  }

  const hashedPassword =
    await bcrypt.hash(password, 12);

  const user = repository.create({
    email: normalizedEmail,
    password: hashedPassword,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone?.trim() || null,
    role: "student",
    isActive: true,
  });

  const savedUser =
    await repository.save(user);

  return {
    id: savedUser.id,
    email: savedUser.email,
    firstName: savedUser.firstName,
    lastName: savedUser.lastName,
    role: savedUser.role,
    isActive: savedUser.isActive,
  };
}

export async function loginUser(
  email,
  password
) {
  if (!email || !password) {
    throw new Error(
      "Email and password are required."
    );
  }

  const repository =
    AppDataSource.getRepository(User);

  const user =
    await repository.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

  if (!user) {
    throw new Error(
      "Invalid email or password."
    );
  }

  const validPassword =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!validPassword) {
    throw new Error(
      "Invalid email or password."
    );
  }

  if (user.isActive === false) {
    throw new Error(
      "Your account is inactive."
    );
  }

  const secret =
    process.env.JWT_SECRET ||
    "development-only-secret";

  const token = jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
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
      firstName: user.firstName,
      lastName: user.lastName,
      fullName:
        `${user.firstName} ${user.lastName}`,
      role: user.role,
      isActive: user.isActive,
    },
  };
}