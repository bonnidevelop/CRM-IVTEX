import { Schema, model, type Types } from "mongoose";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type LeadPriority,
  type LeadSource,
  type LeadStatus,
} from "../constants/crm.js";

export interface ILead {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedSalesExecutive?: Types.ObjectId | null;
  description?: string;
  convertedCustomerId?: Types.ObjectId | null;
  convertedDealId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
      minlength: [2, "Lead name must contain at least 2 characters"],
      maxlength: [100, "Lead name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Lead email is required"],
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Lead phone number is required"],
      trim: true,
      minlength: [7, "Phone number is too short"],
      maxlength: [20, "Phone number is too long"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
      default: "",
    },
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCES,
        message: "Invalid lead source",
      },
      required: [true, "Lead source is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: LEAD_STATUSES,
        message: "Invalid lead status",
      },
      default: "new",
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: LEAD_PRIORITIES,
        message: "Invalid lead priority",
      },
      default: "medium",
      index: true,
    },
    assignedSalesExecutive: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    convertedCustomerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    convertedDealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

leadSchema.index({ name: "text", email: "text", company: "text" });
leadSchema.index({ createdAt: -1 });

const Lead = model<ILead>("Lead", leadSchema);

export default Lead;
