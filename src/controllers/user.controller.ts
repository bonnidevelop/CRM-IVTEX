import type { RequestHandler } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserStatus,
} from "../services/user.service.js";
import type { ListUsersQuery } from "../validators/user-query.validator.js";
import { sendSuccess } from "../utils/api-response.js";

export const handleCreateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    sendSuccess(res, "User created successfully", user, 201);
  } catch (error) {
    next(error);
  }
};

export const getUsers: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListUsersQuery;
    const result = await listUsers(query);
    sendSuccess(res, "Users retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id as string);
    sendSuccess(res, "User retrieved successfully", user);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await updateUser(req.params.id as string, req.body);
    sendSuccess(res, "User updated successfully", user);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateUserStatus: RequestHandler = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await updateUserStatus(req.params.id as string, isActive);
    sendSuccess(res, `User ${isActive ? "activated" : "deactivated"} successfully`, user);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteUser(req.params.id as string);
    sendSuccess(res, "User deleted successfully", result);
  } catch (error) {
    next(error);
  }
};