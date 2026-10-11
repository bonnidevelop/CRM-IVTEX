import { z } from "zod";
import { USER_ROLES } from "../constants/user-roles.js";

export const listUsersQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),

    role: z.enum(USER_ROLES).optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    sortBy: z
      .enum(["name", "email", "role", "createdAt", "updatedAt"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;