import mongoose from "mongoose";
import Lead, { type ILead } from "../models/lead.model.js";
import Customer from "../models/customer.model.js";
import Deal from "../models/deal.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { logTimeline } from "./timeline.service.js";
import type { AuthenticatedUser } from "../types/auth.js";
import type {
  AssignLeadInput,
  ConvertLeadInput,
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
  UpdateLeadStatusInput,
} from "../validators/lead.validator.js";

export async function createLead(input: CreateLeadInput, user: AuthenticatedUser) {
  let assignedSalesExecutiveId: mongoose.Types.ObjectId | null = null;

  if (user.role === "sales_executive") {
    // Sales Executive is automatically assigned to the leads they create
    assignedSalesExecutiveId = new mongoose.Types.ObjectId(user.id);
  } else if (input.assignedSalesExecutive) {
    const executive = await User.findById(input.assignedSalesExecutive);
    if (!executive || !executive.isActive) {
      throw new AppError("Assigned user not found or inactive", 400);
    }
    assignedSalesExecutiveId = new mongoose.Types.ObjectId(input.assignedSalesExecutive);
  }

  const lead = await Lead.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company || "",
    source: input.source,
    status: input.status || "new",
    priority: input.priority || "medium",
    assignedSalesExecutive: assignedSalesExecutiveId,
    description: input.description || "",
  });

  await logTimeline({
    action: "lead_created",
    entityType: "lead",
    entityId: lead.id,
    performedBy: user.id,
    newValue: {
      name: lead.name,
      status: lead.status,
      assignedSalesExecutive: assignedSalesExecutiveId?.toString() || null,
    },
  });

  return lead;
}

export async function listLeads(query: ListLeadsQuery, user: AuthenticatedUser) {
  const {
    page,
    limit,
    search,
    status,
    priority,
    source,
    assignedUser,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, any> = {};

  // Role-based visibility
  if (user.role === "sales_executive") {
    filter.assignedSalesExecutive = new mongoose.Types.ObjectId(user.id);
  } else if (assignedUser) {
    filter.assignedSalesExecutive = new mongoose.Types.ObjectId(assignedUser);
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (source) filter.source = source;

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

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedSalesExecutive", "name email role")
      .populate("convertedCustomerId", "name email")
      .populate("convertedDealId", "dealName dealValue currentStage")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    leads: leads.map((l) => ({
      ...l,
      id: l._id.toString(),
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

export async function getLeadById(leadId: string, user: AuthenticatedUser) {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const lead = await Lead.findById(leadId)
    .populate("assignedSalesExecutive", "name email role")
    .populate("convertedCustomerId", "name email")
    .populate("convertedDealId", "dealName dealValue currentStage")
    .lean();

  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    lead.assignedSalesExecutive?._id?.toString() !== user.id
  ) {
    throw new AppError("You do not have access to this lead", 403);
  }

  return {
    ...lead,
    id: lead._id.toString(),
  };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    lead.assignedSalesExecutive?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to update this lead", 403);
  }

  const prevPriority = lead.priority;
  const prevStatus = lead.status;

  if (input.status && lead.status === "converted" && input.status !== "converted") {
    throw new AppError("Cannot change status of an already converted lead", 400);
  }

  if (input.status === "converted" && lead.status !== "converted") {
    throw new AppError("Direct update to converted status not allowed; use the convert endpoint", 400);
  }

  if (input.name) lead.name = input.name;
  if (input.email) lead.email = input.email;
  if (input.phone) lead.phone = input.phone;
  if (input.company !== undefined) lead.company = input.company;
  if (input.source) lead.source = input.source;
  if (input.status) lead.status = input.status;
  if (input.priority) lead.priority = input.priority;
  if (input.description !== undefined) lead.description = input.description;

  await lead.save();

  if (input.priority && input.priority !== prevPriority) {
    await logTimeline({
      action: "lead_priority_changed",
      entityType: "lead",
      entityId: lead.id,
      performedBy: user.id,
      previousValue: prevPriority,
      newValue: input.priority,
    });
  }

  if (input.status && input.status !== prevStatus) {
    await logTimeline({
      action: "lead_status_changed",
      entityType: "lead",
      entityId: lead.id,
      performedBy: user.id,
      previousValue: prevStatus,
      newValue: input.status,
    });
  }

  return lead;
}

export async function updateLeadStatus(
  leadId: string,
  input: UpdateLeadStatusInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    lead.assignedSalesExecutive?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to update this lead status", 403);
  }

  if (lead.status === "converted" && input.status !== "converted") {
    throw new AppError("Cannot change status of an already converted lead", 400);
  }

  if (input.status === "converted" && lead.status !== "converted") {
    throw new AppError("Direct update to converted status not allowed; use the convert endpoint", 400);
  }

  const oldStatus = lead.status;
  lead.status = input.status;
  await lead.save();

  await logTimeline({
    action: "lead_status_changed",
    entityType: "lead",
    entityId: lead.id,
    performedBy: user.id,
    previousValue: oldStatus,
    newValue: input.status,
  });

  return lead;
}

export async function assignLead(
  leadId: string,
  input: AssignLeadInput,
  user: AuthenticatedUser
) {
  if (user.role === "sales_executive") {
    throw new AppError("Sales executives cannot reassign leads", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const [lead, targetUser] = await Promise.all([
    Lead.findById(leadId),
    User.findById(input.assignedSalesExecutive),
  ]);

  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (!targetUser || !targetUser.isActive) {
    throw new AppError("Target assignee not found or is inactive", 400);
  }

  const previousAssignee = lead.assignedSalesExecutive?.toString() || null;
  const newAssignee = targetUser.id;

  lead.assignedSalesExecutive = targetUser._id;
  await lead.save();

  await logTimeline({
    action: previousAssignee ? "lead_reassigned" : "lead_assigned",
    entityType: "lead",
    entityId: lead.id,
    performedBy: user.id,
    previousValue: previousAssignee,
    newValue: newAssignee,
    metadata: {
      assigneeName: targetUser.name,
      assigneeEmail: targetUser.email,
    },
  });

  return lead;
}

export async function convertLead(
  leadId: string,
  input: ConvertLeadInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    lead.assignedSalesExecutive?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to convert this lead", 403);
  }

  if (lead.status === "converted" || lead.convertedCustomerId) {
    throw new AppError("This lead has already been converted", 400);
  }

  if (lead.status !== "qualified") {
    throw new AppError(
      `Only qualified leads can be converted. Current status: ${lead.status}`,
      400
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create Customer
    const [customer] = await Customer.create(
      [
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company || "",
          address: input.customerAddress || "",
          originalLeadReference: lead._id,
          assignedSalesExecutive: lead.assignedSalesExecutive,
          status: "active",
        },
      ],
      { session }
    );

    // 2. Create Deal
    const [deal] = await Deal.create(
      [
        {
          dealName: input.dealName,
          leadReference: lead._id,
          customerReference: customer._id,
          assignedEmployee: lead.assignedSalesExecutive,
          dealValue: input.dealValue,
          probability: input.probability,
          expectedClosingDate: input.expectedClosingDate,
          currentStage: input.dealStage || "qualification",
        },
      ],
      { session }
    );

    // 3. Update Lead
    lead.status = "converted";
    lead.convertedCustomerId = customer._id;
    lead.convertedDealId = deal._id;
    await lead.save({ session });

    // 4. Log timeline entries
    await logTimeline({
      action: "lead_converted",
      entityType: "lead",
      entityId: lead.id,
      performedBy: user.id,
      newValue: {
        customerId: customer.id,
        dealId: deal.id,
      },
      session,
    });

    await logTimeline({
      action: "customer_created",
      entityType: "customer",
      entityId: customer.id,
      performedBy: user.id,
      newValue: {
        fromLeadId: lead.id,
        name: customer.name,
      },
      session,
    });

    await logTimeline({
      action: "deal_created",
      entityType: "deal",
      entityId: deal.id,
      performedBy: user.id,
      newValue: {
        dealName: deal.dealName,
        dealValue: deal.dealValue,
        stage: deal.currentStage,
      },
      session,
    });

    await session.commitTransaction();

    return {
      lead: {
        id: lead.id,
        status: lead.status,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      deal: {
        id: deal.id,
        dealName: deal.dealName,
        dealValue: deal.dealValue,
        currentStage: deal.currentStage,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function deleteLead(leadId: string, user: AuthenticatedUser) {
  if (user.role !== "admin") {
    throw new AppError("Only admin users are permitted to delete leads", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead ID", 400);
  }

  const lead = await Lead.findByIdAndDelete(leadId);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  return { id: leadId };
}
