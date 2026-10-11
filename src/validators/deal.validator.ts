import { z } from "zod";
import { DEAL_STAGES } from "../constants/crm.js";
import { objectIdSchema } from "./common.validator.js";

export const createDealSchema = z
  .object({
    dealName: z
      .string()
      .trim()
      .min(2, "Deal name must contain at least 2 characters")
      .max(150, "Deal name cannot exceed 150 characters"),
    customerReference: objectIdSchema,
    leadReference: objectIdSchema.optional().nullable(),
    assignedEmployee: objectIdSchema.optional().nullable(),
    dealValue: z.number().positive("Deal value must be greater than zero"),
    probability: z
      .number()
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100"),
    expectedClosingDate: z.coerce.date(),
    currentStage: z.enum(DEAL_STAGES).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateDealSchema = z
  .object({
    dealName: z
      .string()
      .trim()
      .min(2, "Deal name must contain at least 2 characters")
      .max(150, "Deal name cannot exceed 150 characters")
      .optional(),
    dealValue: z.number().positive("Deal value must be greater than zero").optional(),
    probability: z
      .number()
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100")
      .optional(),
    expectedClosingDate: z.coerce.date().optional(),
    assignedEmployee: objectIdSchema.optional().nullable(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateDealStageSchema = z
  .object({
    currentStage: z.enum(DEAL_STAGES),
    lostReason: z.string().trim().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.currentStage === "lost") {
        return Boolean(data.lostReason && data.lostReason.length >= 3);
      }
      return true;
    },
    {
      message: "A Lost deal must contain an appropriate reason (minimum 3 characters)",
      path: ["lostReason"],
    }
  );

export const listDealsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    stage: z.enum(DEAL_STAGES).optional(),
    assignedUser: objectIdSchema.optional(),
    customer: objectIdSchema.optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    closingDateStart: z.coerce.date().optional(),
    closingDateEnd: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z
      .enum(["dealName", "dealValue", "probability", "expectedClosingDate", "currentStage", "createdAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStageInput = z.infer<typeof updateDealStageSchema>;
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;
