import type { RequestHandler } from "express";
import {
  assignLead,
  convertLead,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  updateLead,
  updateLeadStatus,
} from "../services/lead.service.js";
import { getEntityTimeline } from "../services/timeline.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { ListLeadsQuery } from "../validators/lead.validator.js";

export const handleCreateLead: RequestHandler = async (req, res, next) => {
  try {
    const lead = await createLead(req.body, req.auth!);
    sendSuccess(res, "Lead created successfully", lead, 201);
  } catch (error) {
    next(error);
  }
};

export const handleGetLeads: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListLeadsQuery;
    const result = await listLeads(query, _req.auth!);
    sendSuccess(res, "Leads retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetLeadById: RequestHandler = async (req, res, next) => {
  try {
    const lead = await getLeadById(req.params.id as string, req.auth!);
    sendSuccess(res, "Lead retrieved successfully", lead);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateLead: RequestHandler = async (req, res, next) => {
  try {
    const lead = await updateLead(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Lead updated successfully", lead);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateLeadStatus: RequestHandler = async (req, res, next) => {
  try {
    const lead = await updateLeadStatus(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Lead status updated successfully", lead);
  } catch (error) {
    next(error);
  }
};

export const handleAssignLead: RequestHandler = async (req, res, next) => {
  try {
    const lead = await assignLead(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Lead assigned successfully", lead);
  } catch (error) {
    next(error);
  }
};

export const handleConvertLead: RequestHandler = async (req, res, next) => {
  try {
    const result = await convertLead(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Lead converted successfully to Customer and Deal", result);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteLead: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteLead(req.params.id as string, req.auth!);
    sendSuccess(res, "Lead deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetLeadTimeline: RequestHandler = async (req, res, next) => {
  try {
    const timeline = await getEntityTimeline("lead", req.params.id as string);
    sendSuccess(res, "Lead timeline retrieved successfully", timeline);
  } catch (error) {
    next(error);
  }
};
