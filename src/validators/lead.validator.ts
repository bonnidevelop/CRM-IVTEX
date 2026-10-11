import { z } from "zod";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "../constants/crm.js";
import { objectIdSchema } from "./common.validator.js";

export const createLeadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Lead name must contain at least 2 characters")
      .max(100, "Lead name cannot exceed 100 characters"),
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
      .regex(/^[+]?[\d\s().-]+$/, "Please provide a valid phone number"),
    company: z.string().trim().max(150).optional(),
    source: z.enum(LEAD_SOURCES),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    assignedSalesExecutive: objectIdSchema.optional().nullable(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateLeadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Lead name must contain at least 2 characters")
      .max(100, "Lead name cannot exceed 100 characters")
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
      .regex(/^[+]?[\d\s().-]+$/, "Please provide a valid phone number")
      .optional(),
    company: z.string().trim().max(150).optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateLeadStatusSchema = z
  .object({
    status: z.enum(LEAD_STATUSES),
  })
  .strict();

export const assignLeadSchema = z
  .object({
    assignedSalesExecutive: objectIdSchema,
  })
  .strict();

export const convertLeadSchema = z
  .object({
    dealName: z.string().trim().min(2).max(150),
    dealValue: z.number().positive("Deal value must be greater than zero"),
    probability: z.number().min(0).max(100),
    expectedClosingDate: z.coerce.date(),
    dealStage: z
      .enum(["qualification", "discovery", "proposal", "negotiation", "won", "lost"])
      .optional(),
    customerAddress: z.string().trim().max(500).optional(),
  })
  .strict();

export const listLeadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    assignedUser: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z
      .enum(["name", "email", "status", "priority", "source", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
