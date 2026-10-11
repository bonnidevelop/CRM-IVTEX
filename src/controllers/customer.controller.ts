import type { RequestHandler } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "../services/customer.service.js";
import { getEntityTimeline } from "../services/timeline.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { ListCustomersQuery } from "../validators/customer.validator.js";

export const handleCreateCustomer: RequestHandler = async (req, res, next) => {
  try {
    const customer = await createCustomer(req.body, req.auth!);
    sendSuccess(res, "Customer created successfully", customer, 201);
  } catch (error) {
    next(error);
  }
};

export const handleGetCustomers: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListCustomersQuery;
    const result = await listCustomers(query, _req.auth!);
    sendSuccess(res, "Customers retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetCustomerById: RequestHandler = async (req, res, next) => {
  try {
    const customer = await getCustomerById(req.params.id as string, req.auth!);
    sendSuccess(res, "Customer retrieved successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateCustomer: RequestHandler = async (req, res, next) => {
  try {
    const customer = await updateCustomer(req.params.id as string, req.body, req.auth!);
    sendSuccess(res, "Customer updated successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteCustomer: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteCustomer(req.params.id as string, req.auth!);
    sendSuccess(res, "Customer deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleGetCustomerTimeline: RequestHandler = async (req, res, next) => {
  try {
    const timeline = await getEntityTimeline("customer", req.params.id as string);
    sendSuccess(res, "Customer timeline retrieved successfully", timeline);
  } catch (error)
  {
    next(error);
  }
};
