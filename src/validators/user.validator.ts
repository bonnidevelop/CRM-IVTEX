import { z } from "zod";
import { USER_ROLES } from "../constants/user-roles.js";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .max(254, "Email cannot exceed 254 characters"),

    phone: z
      .string()
      .trim()
      .min(7, "Phone number is too short")
      .max(20, "Phone number is too long")
      .regex(
        /^[+]?[\d\s().-]+$/,
        "Please provide a valid phone number"
      ),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),

    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .max(254, "Email cannot exceed 254 characters")
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7, "Phone number is too short")
      .max(20, "Phone number is too long")
      .regex(
        /^[+]?[\d\s().-]+$/,
        "Please provide a valid phone number"
      )
      .optional(),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .optional(),

    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
