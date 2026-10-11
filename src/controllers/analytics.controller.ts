import type { RequestHandler } from "express";
import {
  getDashboardMetrics,
  getSalesPipeline,
  getTeamPerformance,
} from "../services/analytics.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const handleGetDashboardMetrics: RequestHandler = async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics(req.auth!);
    sendSuccess(res, "Dashboard metrics retrieved successfully", metrics);
  } catch (error) {
    next(error);
  }
};

export const handleGetSalesPipeline: RequestHandler = async (req, res, next) => {
  try {
    const pipeline = await getSalesPipeline(req.auth!);
    sendSuccess(res, "Sales pipeline retrieved successfully", pipeline);
  } catch (error) {
    next(error);
  }
};

export const handleGetTeamPerformance: RequestHandler = async (_req, res, next) => {
  try {
    const performance = await getTeamPerformance();
    sendSuccess(res, "Team performance metrics retrieved successfully", performance);
  } catch (error) {
    next(error);
  }
};
