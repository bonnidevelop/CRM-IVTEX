import { z } from "zod";
import {
  ACTIVITY_ENTITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
} from "../constants/crm.js";
import { objectIdSchema } from "./common.validator.js";

export const createActivitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES),
    title: z
      .string()
      .trim()
      .min(2, "Title must contain at least 2 characters")
      .max(200, "Title cannot exceed 200 characters"),
    description: z.string().trim().max(2000).optional(),
    assignedUser: objectIdSchema.optional(),
    dueDate: z.coerce.date(),
    status: z.enum(ACTIVITY_STATUSES).optional(),
    relatedEntityType: z.enum(ACTIVITY_ENTITY_TYPES),
    relatedEntityId: objectIdSchema,
  })
  .strict();

export const updateActivitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES).optional(),
    title: z
      .string()
      .trim()
      .min(2, "Title must contain at least 2 characters")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    description: z.string().trim().max(2000).optional(),
    assignedUser: objectIdSchema.optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(ACTIVITY_STATUSES).optional(),
  })
  .strict();

export const listActivitiesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    type: z.enum(ACTIVITY_TYPES).optional(),
    status: z.enum(ACTIVITY_STATUSES).optional(),
    assignedUser: objectIdSchema.optional(),
    relatedEntityType: z.enum(ACTIVITY_ENTITY_TYPES).optional(),
    relatedEntityId: objectIdSchema.optional(),
    dueDateStart: z.coerce.date().optional(),
    dueDateEnd: z.coerce.date().optional(),
    sortBy: z.enum(["dueDate", "status", "type", "createdAt"]).default("dueDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
