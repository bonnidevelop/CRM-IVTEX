import type { RequestHandler } from "express";
import type { UserRole } from "../constants/user-roles.js";
import { AppError } from "../utils/app-error.js";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
}