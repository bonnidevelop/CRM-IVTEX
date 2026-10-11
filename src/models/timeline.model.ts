import { Schema, model, type Types } from "mongoose";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
  type TimelineAction,
  type TimelineEntityType,
} from "../constants/crm.js";

export interface ITimeline {
  action: TimelineAction;
  entityType: TimelineEntityType;
  entityId: Types.ObjectId;
  performedBy: Types.ObjectId;
  previousValue?: Record<string, unknown> | string | null;
  newValue?: Record<string, unknown> | string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const timelineSchema = new Schema<ITimeline>(
  {
    action: {
      type: String,
      enum: {
        values: TIMELINE_ACTIONS,
        message: "Invalid timeline action",
      },
      required: [true, "Action is required"],
      index: true,
    },
    entityType: {
      type: String,
      enum: {
        values: TIMELINE_ENTITY_TYPES,
        message: "Invalid entity type",
      },
      required: [true, "Entity type is required"],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed by user is required"],
      index: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for querying timeline of a specific entity
timelineSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const Timeline = model<ITimeline>("Timeline", timelineSchema);

export default Timeline;
