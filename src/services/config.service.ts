import mongoose from "mongoose";
import CRMConfig from "../models/config.model.js";
import type { UpdateCRMConfigInput } from "../validators/config.validator.js";

export async function getCRMConfig() {
  let config = await CRMConfig.findOne().populate("updatedBy", "name email").lean();

  if (!config) {
    const created = await CRMConfig.create({
      companyName: "CRM Enterprise",
      leadQualificationThreshold: 50,
      dealProbabilityRules: {
        qualification: 10,
        discovery: 30,
        proposal: 60,
        negotiation: 80,
        won: 100,
        lost: 0,
      },
      allowedCurrency: "USD",
    });
    return created.toObject();
  }

  return config;
}

export async function updateCRMConfig(
  input: UpdateCRMConfigInput,
  userId: string
) {
  let config = await CRMConfig.findOne();

  if (!config) {
    config = new CRMConfig();
  }

  if (input.companyName) config.companyName = input.companyName;
  if (input.leadQualificationThreshold !== undefined) {
    config.leadQualificationThreshold = input.leadQualificationThreshold;
  }
  if (input.allowedCurrency) config.allowedCurrency = input.allowedCurrency;
  if (input.dealProbabilityRules) {
    config.dealProbabilityRules = {
      ...config.dealProbabilityRules,
      ...input.dealProbabilityRules,
    };
  }

  config.updatedBy = new mongoose.Types.ObjectId(userId);
  await config.save();

  return config;
}
