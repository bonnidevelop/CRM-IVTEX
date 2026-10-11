import mongoose from "mongoose";
import Deal, { type IDeal } from "../models/deal.model.js";
import Customer from "../models/customer.model.js";
import Lead from "../models/lead.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { logTimeline } from "./timeline.service.js";
import type { AuthenticatedUser } from "../types/auth.js";
import type {
  CreateDealInput,
  ListDealsQuery,
  UpdateDealInput,
  UpdateDealStageInput,
} from "../validators/deal.validator.js";

export async function createDeal(input: CreateDealInput, user: AuthenticatedUser) {
  if (!mongoose.Types.ObjectId.isValid(input.customerReference)) {
    throw new AppError("Invalid customer reference", 400);
  }

  const customer = await Customer.findById(input.customerReference);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  let leadRef: mongoose.Types.ObjectId | null = null;
  if (input.leadReference) {
    if (!mongoose.Types.ObjectId.isValid(input.leadReference)) {
      throw new AppError("Invalid lead reference", 400);
    }
    const lead = await Lead.findById(input.leadReference);
    if (!lead) {
      throw new AppError("Referenced lead not found", 404);
    }
    leadRef = lead._id;
  }

  let assignedEmployeeId: mongoose.Types.ObjectId | null = null;
  if (user.role === "sales_executive") {
    assignedEmployeeId = new mongoose.Types.ObjectId(user.id);
  } else if (input.assignedEmployee) {
    const employee = await User.findById(input.assignedEmployee);
    if (!employee || !employee.isActive) {
      throw new AppError("Assigned employee not found or inactive", 400);
    }
    assignedEmployeeId = new mongoose.Types.ObjectId(input.assignedEmployee);
  } else if (customer.assignedSalesExecutive) {
    assignedEmployeeId = customer.assignedSalesExecutive;
  }

  const calculatedExpectedRevenue = Number(
    ((input.dealValue * input.probability) / 100).toFixed(2)
  );

  const deal = await Deal.create({
    dealName: input.dealName,
    customerReference: customer._id,
    leadReference: leadRef,
    assignedEmployee: assignedEmployeeId,
    dealValue: input.dealValue,
    probability: input.probability,
    expectedRevenue: calculatedExpectedRevenue,
    expectedClosingDate: input.expectedClosingDate,
    currentStage: input.currentStage || "qualification",
    description: input.description || "",
  });

  await logTimeline({
    action: "deal_created",
    entityType: "deal",
    entityId: deal.id,
    performedBy: user.id,
    newValue: {
      dealName: deal.dealName,
      dealValue: deal.dealValue,
      currentStage: deal.currentStage,
    },
  });

  return deal;
}

export async function listDeals(query: ListDealsQuery, user: AuthenticatedUser) {
  const {
    page,
    limit,
    search,
    stage,
    assignedUser,
    customer,
    minAmount,
    maxAmount,
    closingDateStart,
    closingDateEnd,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, any> = {};

  if (user.role === "sales_executive") {
    filter.assignedEmployee = new mongoose.Types.ObjectId(user.id);
  } else if (assignedUser) {
    filter.assignedEmployee = new mongoose.Types.ObjectId(assignedUser);
  }

  if (customer) {
    filter.customerReference = new mongoose.Types.ObjectId(customer);
  }

  if (stage) filter.currentStage = stage;

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.dealValue = {};
    if (minAmount !== undefined) filter.dealValue.$gte = minAmount;
    if (maxAmount !== undefined) filter.dealValue.$lte = maxAmount;
  }

  if (closingDateStart || closingDateEnd) {
    filter.expectedClosingDate = {};
    if (closingDateStart) filter.expectedClosingDate.$gte = new Date(closingDateStart);
    if (closingDateEnd) filter.expectedClosingDate.$lte = new Date(closingDateEnd);
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.dealName = new RegExp(escapedSearch, "i");
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [deals, total] = await Promise.all([
    Deal.find(filter)
      .populate("customerReference", "name email company")
      .populate("leadReference", "name email status source")
      .populate("assignedEmployee", "name email role")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Deal.countDocuments(filter),
  ]);

  return {
    deals: deals.map((d) => ({
      ...d,
      id: d._id.toString(),
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

export async function getDealById(dealId: string, user: AuthenticatedUser) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new AppError("Invalid deal ID", 400);
  }

  const deal = await Deal.findById(dealId)
    .populate("customerReference", "name email company phone")
    .populate("leadReference", "name email status source")
    .populate("assignedEmployee", "name email role")
    .lean();

  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    deal.assignedEmployee?._id?.toString() !== user.id
  ) {
    throw new AppError("You do not have access to this deal", 403);
  }

  return {
    ...deal,
    id: deal._id.toString(),
  };
}

export async function updateDeal(
  dealId: string,
  input: UpdateDealInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new AppError("Invalid deal ID", 400);
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    deal.assignedEmployee?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to modify this deal", 403);
  }

  if (input.dealName) deal.dealName = input.dealName;
  if (input.dealValue !== undefined) deal.dealValue = input.dealValue;
  if (input.probability !== undefined) deal.probability = input.probability;
  deal.expectedRevenue = Number(((deal.dealValue * deal.probability) / 100).toFixed(2));
  if (input.expectedClosingDate) deal.expectedClosingDate = input.expectedClosingDate;
  if (input.description !== undefined) deal.description = input.description;

  if (input.assignedEmployee !== undefined) {
    if (user.role === "sales_executive") {
      throw new AppError("Sales executives cannot reassign deals", 403);
    }
    if (input.assignedEmployee) {
      const employee = await User.findById(input.assignedEmployee);
      if (!employee || !employee.isActive) {
        throw new AppError("Assigned employee not found or inactive", 400);
      }
      deal.assignedEmployee = new mongoose.Types.ObjectId(input.assignedEmployee);
      await logTimeline({
        action: "deal_assigned",
        entityType: "deal",
        entityId: deal.id,
        performedBy: user.id,
        newValue: input.assignedEmployee,
      });
    } else {
      deal.assignedEmployee = null;
    }
  }

  await deal.save();
  return deal;
}

export async function updateDealStage(
  dealId: string,
  input: UpdateDealStageInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new AppError("Invalid deal ID", 400);
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    deal.assignedEmployee?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to modify this deal stage", 403);
  }

  // Business Rule: Closed Won or Lost deal should not freely move back to an active stage
  if (
    (deal.currentStage === "won" || deal.currentStage === "lost") &&
    input.currentStage !== "won" &&
    input.currentStage !== "lost"
  ) {
    if (user.role !== "admin") {
      throw new AppError(
        `A closed ${deal.currentStage.toUpperCase()} deal cannot be reopened by non-admin users`,
        400
      );
    }
  }

  // Business Rule: Won deal should have valid deal information & 100% probability
  if (input.currentStage === "won") {
    if (!deal.dealValue || deal.dealValue <= 0) {
      throw new AppError("A Won deal must have a valid deal value greater than zero", 400);
    }
    deal.probability = 100;
    deal.expectedRevenue = deal.dealValue;
  }

  // Business Rule: Lost deal should contain an appropriate reason & 0% probability
  if (input.currentStage === "lost") {
    if (!input.lostReason || input.lostReason.trim().length < 3) {
      throw new AppError("A Lost deal must contain an appropriate reason", 400);
    }
    deal.lostReason = input.lostReason;
    deal.probability = 0;
    deal.expectedRevenue = 0;
  }

  const previousStage = deal.currentStage;
  deal.currentStage = input.currentStage;
  await deal.save();

  let timelineAction: "deal_stage_changed" | "deal_won" | "deal_lost" = "deal_stage_changed";
  if (input.currentStage === "won") timelineAction = "deal_won";
  if (input.currentStage === "lost") timelineAction = "deal_lost";

  await logTimeline({
    action: timelineAction,
    entityType: "deal",
    entityId: deal.id,
    performedBy: user.id,
    previousValue: previousStage,
    newValue: input.currentStage,
    metadata: {
      lostReason: deal.lostReason || null,
      dealValue: deal.dealValue,
    },
  });

  return deal;
}

export async function deleteDeal(dealId: string, user: AuthenticatedUser) {
  if (user.role !== "admin") {
    throw new AppError("Only admin users are permitted to delete deals", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new AppError("Invalid deal ID", 400);
  }

  const deal = await Deal.findByIdAndDelete(dealId);
  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  return { id: dealId };
}
