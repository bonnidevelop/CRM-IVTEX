import { z } from "zod";

export const updateCRMConfigSchema = z
  .object({
    companyName: z.string().trim().min(2).max(100).optional(),
    leadQualificationThreshold: z.number().min(0).max(100).optional(),
    dealProbabilityRules: z
      .object({
        qualification: z.number().min(0).max(100).optional(),
        discovery: z.number().min(0).max(100).optional(),
        proposal: z.number().min(0).max(100).optional(),
        negotiation: z.number().min(0).max(100).optional(),
        won: z.number().min(0).max(100).optional(),
        lost: z.number().min(0).max(100).optional(),
      })
      .optional(),
    allowedCurrency: z.string().trim().max(10).optional(),
  })
  .strict();

export type UpdateCRMConfigInput = z.infer<typeof updateCRMConfigSchema>;
