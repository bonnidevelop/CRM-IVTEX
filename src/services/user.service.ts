import { MongoServerError } from "mongodb";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";
import type { ListUsersQuery } from "../validators/user-query.validator.js";
import { AppError } from "../utils/app-error.js";
import bcrypt from "bcryptjs";

export async function createUser(input: CreateUserInput) {
  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: input.role ?? "sales_executive",
      isActive: input.isActive ?? true,
    });

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
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new AppError("Email is already registered", 409);
    }
    throw error;
  }
}

export async function listUsers(query: ListUsersQuery) {
  const { search, role, isActive, page, limit, sortBy, sortOrder } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getUserById(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (input.email && input.email !== user.email) {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new AppError("Email is already registered", 409);
    }
    user.email = input.email;
  }

  if (input.name) user.name = input.name;
  if (input.phone) user.phone = input.phone;
  if (input.role) user.role = input.role;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.password) {
    user.password = input.password; // pre save hook hashes it
  }

  await user.save();

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

export async function updateUserStatus(userId: string, isActive: boolean) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
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

export async function deleteUser(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return { id: userId };
}