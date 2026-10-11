import type { RequestHandler } from "express";
import {
  createDeal,
  deleteDeal,
  getDealById,
  listDeals,
  updateDeal,
  updateDealStage,
} from "../services/deal.service.js";
import { getEntityTimeline } from "../services/timeline.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { ListDealsQuery } from "../validators/deal.validator.js";

export const handleCreateDeal: RequestHandler = async (req, res, next) => {
  try {
    const deal = await createDeal(req.body, req.auth!);
    sendSuccess(res, "Deal created successfully", deal, 201);
  } catch (error) {
    next(error);
  }
};

export const handleGetDeals: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListDealsQuery;
    const result = await listDeals(query, _req.auth!);
    sendSuccess(res, "Deals retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetDealById: RequestHandler = async (req, res, next) => {
  try {
    const deal = await getDealById(req.params.id as string, req.auth!);
    sendSuccess(res, "Deal retrieved successfully", deal);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateDeal: RequestHandler = async (req, res, next) => {
  try {
    const deal = await updateDeal(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Deal updated successfully", deal);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateDealStage: RequestHandler = async (req, res, next) => {
  try {
    const deal = await updateDealStage(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Deal stage updated successfully", deal);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteDeal: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteDeal(req.params.id as string, req.auth!);
    sendSuccess(res, "Deal deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetDealTimeline: RequestHandler = async (req, res, next) => {
  try {
    const timeline = await getEntityTimeline("deal", req.params.id as string);
    sendSuccess(res, "Deal timeline retrieved successfully", timeline);
  } catch (error) {
    next(error);
  }
};
