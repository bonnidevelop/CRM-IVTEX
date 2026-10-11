import type { RequestHandler } from "express";
import { getCRMConfig, updateCRMConfig } from "../services/config.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const handleGetConfig: RequestHandler = async (_req, res, next) => {
  try {
    const config = await getCRMConfig();
    sendSuccess(res, "CRM configuration retrieved successfully", config);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateConfig: RequestHandler = async (req, res, next) => {
  try {
    const config = await updateCRMConfig(req.body, req.auth!.id);
    sendSuccess(res, "CRM configuration updated successfully", config);
  } catch (error) {
    next(error);
  }
};
