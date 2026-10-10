import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  console.error("Unhandled application error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};