import { Schema, model, type Types } from "mongoose";
import {
  ACTIVITY_ENTITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  type ActivityEntityType,
  type ActivityStatus,
  type ActivityType,
} from "../constants/crm.js";

export interface IActivity {
  type: ActivityType;
  title: string;
  description?: string;
  assignedUser: Types.ObjectId;
  dueDate: Date;
  status: ActivityStatus;
  relatedEntityType: ActivityEntityType;
  relatedEntityId: Types.ObjectId;
  createdBy: Types.ObjectId;
  completedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: {
        values: ACTIVITY_TYPES,
        message: "Invalid activity type",
      },
      required: [true, "Activity type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      minlength: [2, "Title must contain at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    assignedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned user is required"],
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ACTIVITY_STATUSES,
        message: "Invalid activity status",
      },
      default: "pending",
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: {
        values: ACTIVITY_ENTITY_TYPES,
        message: "Invalid related entity type",
      },
      required: [true, "Related entity type is required"],
      index: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      required: [true, "Related entity ID is required"],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
      index: true,
    },
    completedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

activitySchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
activitySchema.index({ assignedUser: 1, status: 1, dueDate: 1 });

const Activity = model<IActivity>("Activity", activitySchema);

export default Activity;
