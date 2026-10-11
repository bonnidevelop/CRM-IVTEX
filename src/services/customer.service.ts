import mongoose from "mongoose";
import Customer, { type ICustomer } from "../models/customer.model.js";
import Deal from "../models/deal.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { logTimeline } from "./timeline.service.js";
import type { AuthenticatedUser } from "../types/auth.js";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "../validators/customer.validator.js";

export async function createCustomer(
  input: CreateCustomerInput,
  user: AuthenticatedUser
) {
  let assignedSalesExecutiveId: mongoose.Types.ObjectId | null = null;

  if (user.role === "sales_executive") {
    assignedSalesExecutiveId = new mongoose.Types.ObjectId(user.id);
  } else if (input.assignedSalesExecutive) {
    const executive = await User.findById(input.assignedSalesExecutive);
    if (!executive || !executive.isActive) {
      throw new AppError("Assigned user not found or inactive", 400);
    }
    assignedSalesExecutiveId = new mongoose.Types.ObjectId(input.assignedSalesExecutive);
  }

  const customer = await Customer.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company || "",
    address: input.address || "",
    originalLeadReference: input.originalLeadReference
      ? new mongoose.Types.ObjectId(input.originalLeadReference)
      : null,
    assignedSalesExecutive: assignedSalesExecutiveId,
    status: input.status || "active",
  });

  await logTimeline({
    action: "customer_created",
    entityType: "customer",
    entityId: customer.id,
    performedBy: user.id,
    newValue: {
      name: customer.name,
      email: customer.email,
    },
  });

  return customer;
}

export async function listCustomers(
  query: ListCustomersQuery,
  user: AuthenticatedUser
) {
  const {
    page,
    limit,
    search,
    status,
    assignedUser,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, any> = {};

  if (user.role === "sales_executive") {
    filter.assignedSalesExecutive = new mongoose.Types.ObjectId(user.id);
  } else if (assignedUser) {
    filter.assignedSalesExecutive = new mongoose.Types.ObjectId(assignedUser);
  }

  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { company: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate("assignedSalesExecutive", "name email role")
      .populate("originalLeadReference", "name email status source")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return {
    customers: customers.map((c) => ({
      ...c,
      id: c._id.toString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getCustomerById(
  customerId: string,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError("Invalid customer ID", 400);
  }

  const customer = await Customer.findById(customerId)
    .populate("assignedSalesExecutive", "name email role")
    .populate("originalLeadReference", "name email status source")
    .lean();

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    customer.assignedSalesExecutive?._id?.toString() !== user.id
  ) {
    throw new AppError("You do not have access to this customer", 403);
  }

  // Also fetch related deals for complete CRM relationship visibility
  const deals = await Deal.find({
    customerReference: customer._id,
  }).lean();

  return {
    ...customer,
    id: customer._id.toString(),
    deals: deals.map((d) => ({ ...d, id: d._id.toString() })),
  };
}

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError("Invalid customer ID", 400);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    customer.assignedSalesExecutive?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to update this customer", 403);
  }

  if (input.name) customer.name = input.name;
  if (input.email) customer.email = input.email;
  if (input.phone) customer.phone = input.phone;
  if (input.company !== undefined) customer.company = input.company;
  if (input.address !== undefined) customer.address = input.address;
  if (input.status) customer.status = input.status;

  if (input.assignedSalesExecutive !== undefined) {
    if (user.role === "sales_executive") {
      throw new AppError("Sales executives cannot reassign customers", 403);
    }
    if (input.assignedSalesExecutive) {
      const executive = await User.findById(input.assignedSalesExecutive);
      if (!executive || !executive.isActive) {
        throw new AppError("Assigned user not found or inactive", 400);
      }
      customer.assignedSalesExecutive = new mongoose.Types.ObjectId(
        input.assignedSalesExecutive
      );
    } else {
      customer.assignedSalesExecutive = null;
    }
  }

  await customer.save();
  return customer;
}

export async function deleteCustomer(
  customerId: string,
  user: AuthenticatedUser
) {
  if (user.role !== "admin") {
    throw new AppError("Only admin users are permitted to delete customers", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError("Invalid customer ID", 400);
  }

  const customer = await Customer.findByIdAndDelete(customerId);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return { id: customerId };
}
