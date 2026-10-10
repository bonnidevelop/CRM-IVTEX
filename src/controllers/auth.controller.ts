import type { RequestHandler } from "express";

import { registerUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

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