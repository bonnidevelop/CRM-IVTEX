import { MongoServerError } from "mongodb";
import User from "../models/user.model.js";
import type { CreateUserInput } from "../validators/user.validator.js";
import { AppError } from "../utils/app-error.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput } from "../validators/auth.validator.js";


export async function registerUser(input: CreateUserInput) {
  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: "sales_executive",
    });

    // Return only fields that are safe to expose.
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      throw new AppError("Email is already registered", 409);
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({
    email: input.email,
  }).select("+password");

  // Use the same error for missing users and incorrect passwords.
  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be configured securely");
  }

  const accessToken = jwt.sign(
    {
      role: user.role,
    },
    jwtSecret,
    {
      subject: user.id,
      expiresIn: "15m",
      algorithm: "HS256",
    }
  );

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User account not found or inactive", 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}