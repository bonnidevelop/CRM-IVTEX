import type { RequestHandler } from "express";
import { sendSuccess } from "../utils/api-response.js";
import { loginUser,getCurrentUser,registerUser } from "../services/auth.service.js";

export const register: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const user = await registerUser(req.body);

    sendSuccess(
      res,
      "User registered successfully",
      user,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const result = await loginUser(req.body);

    sendSuccess(
      res,
      "Login successful",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.auth!.id);

    sendSuccess(res, "Current user retrieved successfully", user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_req, res) => {
  sendSuccess(res, "Logged out successfully", { loggedOut: true });
};