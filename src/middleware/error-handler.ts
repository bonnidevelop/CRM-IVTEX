import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  const statusCode =
    typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode < 600
      ? err.statusCode
      : 500;

  const message =
    statusCode === 500
      ? "Internal server error"
      : typeof err.message === "string"
        ? err.message
        : "Request failed";

  if (statusCode === 500) {
    console.error("Unhandled application error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};