import mongoose, { type Types } from "mongoose";
import Timeline from "../models/timeline.model.js";
import {
  type TimelineAction,
  type TimelineEntityType,
} from "../constants/crm.js";

export interface LogTimelineParams {
  action: TimelineAction;
  entityType: TimelineEntityType;
  entityId: string | Types.ObjectId;
  performedBy: string | Types.ObjectId;
  previousValue?: Record<string, unknown> | string | null;
  newValue?: Record<string, unknown> | string | null;
  metadata?: Record<string, unknown>;
  session?: mongoose.ClientSession;
}

export async function logTimeline(params: LogTimelineParams) {
  const {
    action,
    entityType,
    entityId,
    performedBy,
    previousValue = null,
    newValue = null,
    metadata = {},
    session,
  } = params;

  const doc = {
    action,
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
    performedBy: new mongoose.Types.ObjectId(performedBy),
    previousValue,
    newValue,
    metadata,
  };

  if (session) {
    return await Timeline.create([doc], { session });
  }

  return await Timeline.create(doc);
}

export async function getEntityTimeline(
  entityType: TimelineEntityType,
  entityId: string
) {
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    return [];
  }

  return await Timeline.find({
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
  })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .lean();
}
