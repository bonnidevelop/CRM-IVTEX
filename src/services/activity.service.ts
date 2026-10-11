import mongoose from "mongoose";
import Activity, { type IActivity } from "../models/activity.model.js";
import Lead from "../models/lead.model.js";
import Customer from "../models/customer.model.js";
import Deal from "../models/deal.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { logTimeline } from "./timeline.service.js";
import type { AuthenticatedUser } from "../types/auth.js";
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  UpdateActivityInput,
} from "../validators/activity.validator.js";

function computeActivityStatus(activity: {
  status: string;
  dueDate: Date;
  completedDate?: Date | null;
}) {
  if (activity.status === "completed") {
    return "completed";
  }
  const now = new Date();
  if (new Date(activity.dueDate) < now) {
    return "overdue";
  }
  return activity.status;
}

export async function createActivity(
  input: CreateActivityInput,
  user: AuthenticatedUser
) {
  let assignedUserId: mongoose.Types.ObjectId;

  if (input.assignedUser) {
    const assignee = await User.findById(input.assignedUser);
    if (!assignee || !assignee.isActive) {
      throw new AppError("Assigned user not found or inactive", 400);
    }
    assignedUserId = new mongoose.Types.ObjectId(input.assignedUser);
  } else {
    assignedUserId = new mongoose.Types.ObjectId(user.id);
  }

  // Validate related entity exists
  const entityId = new mongoose.Types.ObjectId(input.relatedEntityId);
  if (input.relatedEntityType === "lead") {
    const lead = await Lead.findById(entityId);
    if (!lead) throw new AppError("Related lead not found", 404);
  } else if (input.relatedEntityType === "customer") {
    const cust = await Customer.findById(entityId);
    if (!cust) throw new AppError("Related customer not found", 404);
  } else if (input.relatedEntityType === "deal") {
    const dl = await Deal.findById(entityId);
    if (!dl) throw new AppError("Related deal not found", 404);
  } else if (input.relatedEntityType === "user") {
    const u = await User.findById(entityId);
    if (!u) throw new AppError("Related user not found", 404);
  }

  const initialStatus =
    input.status ||
    (new Date(input.dueDate) < new Date() ? "overdue" : "pending");

  const activity = await Activity.create({
    type: input.type,
    title: input.title,
    description: input.description || "",
    assignedUser: assignedUserId,
    dueDate: input.dueDate,
    status: initialStatus,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: entityId,
    createdBy: new mongoose.Types.ObjectId(user.id),
  });

  // If entity is lead, customer, or deal, log in timeline
  if (input.relatedEntityType !== "user") {
    const action = input.type === "note" ? "note_added" : "follow_up_created";
    await logTimeline({
      action,
      entityType: input.relatedEntityType,
      entityId: activity.relatedEntityId,
      performedBy: user.id,
      newValue: {
        activityId: activity.id,
        title: activity.title,
        type: activity.type,
        dueDate: activity.dueDate,
      },
    });
  }

  return activity;
}

export async function listActivities(
  query: ListActivitiesQuery,
  user: AuthenticatedUser
) {
  const {
    page,
    limit,
    search,
    type,
    status,
    assignedUser,
    relatedEntityType,
    relatedEntityId,
    dueDateStart,
    dueDateEnd,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, any> = {};

  if (user.role === "sales_executive") {
    filter.assignedUser = new mongoose.Types.ObjectId(user.id);
  } else if (assignedUser) {
    filter.assignedUser = new mongoose.Types.ObjectId(assignedUser);
  }

  if (type) filter.type = type;

  // Real-time overdue check logic
  const now = new Date();
  if (status === "overdue") {
    filter.status = { $ne: "completed" };
    filter.dueDate = { $lt: now };
  } else if (status === "pending") {
    filter.status = "pending";
    filter.dueDate = { $gte: now };
  } else if (status === "completed") {
    filter.status = "completed";
  }

  if (relatedEntityType) filter.relatedEntityType = relatedEntityType;
  if (relatedEntityId) {
    filter.relatedEntityId = new mongoose.Types.ObjectId(relatedEntityId);
  }

  if (dueDateStart || dueDateEnd) {
    filter.dueDate = filter.dueDate || {};
    if (dueDateStart) filter.dueDate.$gte = new Date(dueDateStart);
    if (dueDateEnd) filter.dueDate.$lte = new Date(dueDateEnd);
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = new RegExp(escapedSearch, "i");
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("assignedUser", "name email role")
      .populate("createdBy", "name email")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return {
    activities: activities.map((act) => ({
      ...act,
      id: act._id.toString(),
      status: computeActivityStatus(act),
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

export async function getActivityById(activityId: string, user: AuthenticatedUser) {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new AppError("Invalid activity ID", 400);
  }

  const activity = await Activity.findById(activityId)
    .populate("assignedUser", "name email role")
    .populate("createdBy", "name email")
    .lean();

  if (!activity) {
    throw new AppError("Activity not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    activity.assignedUser?._id?.toString() !== user.id
  ) {
    throw new AppError("You do not have access to this activity", 403);
  }

  return {
    ...activity,
    id: activity._id.toString(),
    status: computeActivityStatus(activity),
  };
}

export async function updateActivity(
  activityId: string,
  input: UpdateActivityInput,
  user: AuthenticatedUser
) {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new AppError("Invalid activity ID", 400);
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new AppError("Activity not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    activity.assignedUser?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to modify this activity", 403);
  }

  if (input.type) activity.type = input.type;
  if (input.title) activity.title = input.title;
  if (input.description !== undefined) activity.description = input.description;
  if (input.dueDate) activity.dueDate = input.dueDate;

  if (input.assignedUser) {
    if (user.role === "sales_executive") {
      throw new AppError("Sales executives cannot reassign activities", 403);
    }
    const assignee = await User.findById(input.assignedUser);
    if (!assignee || !assignee.isActive) {
      throw new AppError("Target user not found or inactive", 400);
    }
    activity.assignedUser = new mongoose.Types.ObjectId(input.assignedUser);
  }

  if (input.status) {
    activity.status = input.status;
    if (input.status === "completed" && !activity.completedDate) {
      activity.completedDate = new Date();
    }
  }

  await activity.save();

  return {
    ...activity.toObject(),
    id: activity.id,
    status: computeActivityStatus(activity),
  };
}

export async function completeActivity(activityId: string, user: AuthenticatedUser) {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new AppError("Invalid activity ID", 400);
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new AppError("Activity not found", 404);
  }

  if (
    user.role === "sales_executive" &&
    activity.assignedUser?.toString() !== user.id
  ) {
    throw new AppError("You do not have permission to complete this activity", 403);
  }

  activity.status = "completed";
  activity.completedDate = new Date();
  await activity.save();

  if (activity.relatedEntityType !== "user") {
    await logTimeline({
      action: "follow_up_completed",
      entityType: activity.relatedEntityType,
      entityId: activity.relatedEntityId,
      performedBy: user.id,
      newValue: {
        activityId: activity.id,
        completedAt: activity.completedDate,
      },
    });
  }

  return {
    ...activity.toObject(),
    id: activity.id,
    status: "completed",
  };
}

export async function deleteActivity(activityId: string, user: AuthenticatedUser) {
  if (user.role === "sales_executive") {
    throw new AppError("Sales executives are not permitted to delete activities", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new AppError("Invalid activity ID", 400);
  }

  const activity = await Activity.findByIdAndDelete(activityId);
  if (!activity) {
    throw new AppError("Activity not found", 404);
  }

  return { id: activityId };
}
