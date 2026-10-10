import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { USER_ROLES, type UserRole } from "../constants/user-roles.js";
import { AppError } from "../utils/app-error.js";
import type { AuthenticatedUser } from "../types/auth.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    return next(new Error("JWT_SECRET must be configured securely"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string") {
      return next(new AppError("Invalid or expired access token", 401));
    }

    const payload = decoded as JwtPayload;
    const role = payload.role;

    if (
      typeof payload.sub !== "string" ||
      typeof role !== "string" ||
      !USER_ROLES.includes(role as UserRole)
    ) {
      return next(new AppError("Invalid or expired access token", 401));
    }

    req.auth = {
      id: payload.sub,
      role: role as UserRole,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
};