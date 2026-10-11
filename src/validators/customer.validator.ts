import { z } from "zod";
import { objectIdSchema } from "./common.validator.js";

export const createCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Customer name must contain at least 2 characters")
      .max(100, "Customer name cannot exceed 100 characters"),
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
    address: z.string().trim().max(500).optional(),
    originalLeadReference: objectIdSchema.optional().nullable(),
    assignedSalesExecutive: objectIdSchema.optional().nullable(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Customer name must contain at least 2 characters")
      .max(100, "Customer name cannot exceed 100 characters")
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
    address: z.string().trim().max(500).optional(),
    assignedSalesExecutive: objectIdSchema.optional().nullable(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

export const listCustomersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    assignedUser: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z
      .enum(["name", "email", "company", "status", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
