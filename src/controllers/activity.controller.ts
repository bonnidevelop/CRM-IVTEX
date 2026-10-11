import type { RequestHandler } from "express";
import {
  completeActivity,
  createActivity,
  deleteActivity,
  getActivityById,
  listActivities,
  updateActivity,
} from "../services/activity.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { ListActivitiesQuery } from "../validators/activity.validator.js";

export const handleCreateActivity: RequestHandler = async (req, res, next) => {
  try {
    const activity = await createActivity(req.body, req.auth!);
    sendSuccess(res, "Activity created successfully", activity, 201);
  } catch (error) {
    next(error);
  }
};

export const handleGetActivities: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListActivitiesQuery;
    const result = await listActivities(query, _req.auth!);
    sendSuccess(res, "Activities retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetActivityById: RequestHandler = async (req, res, next) => {
  try {
    const activity = await getActivityById(req.params.id as string, req.auth!);
    sendSuccess(res, "Activity retrieved successfully", activity);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateActivity: RequestHandler = async (req, res, next) => {
  try {
    const activity = await updateActivity(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Activity updated successfully", activity);
  } catch (error) {
    next(error);
  }
};

export const handleCompleteActivity: RequestHandler = async (req, res, next) => {
  try {
    const activity = await completeActivity(req.params.id as string, req.auth!);
    sendSuccess(res, "Activity marked as completed successfully", activity);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteActivity: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteActivity(req.params.id as string, req.auth!);
    sendSuccess(res, "Activity deleted successfully", result);
  } catch (error) {
    next(error);
  }
};
