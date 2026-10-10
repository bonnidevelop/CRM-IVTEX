import { MongoServerError } from "mongodb";

import User from "../models/user.model.js";
import type { CreateUserInput } from "../validators/user.validator.js";
import { AppError } from "../utils/app-error.js";

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