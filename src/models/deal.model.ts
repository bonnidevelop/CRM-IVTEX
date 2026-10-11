import { Schema, model, type Types } from "mongoose";
import { DEAL_STAGES, type DealStage } from "../constants/crm.js";

export interface IDeal {
  dealName: string;
  leadReference?: Types.ObjectId | null;
  customerReference: Types.ObjectId;
  assignedEmployee?: Types.ObjectId | null;
  dealValue: number;
  probability: number;
  expectedRevenue: number;
  expectedClosingDate: Date;
  currentStage: DealStage;
  lostReason?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<IDeal>(
  {
    dealName: {
      type: String,
      required: [true, "Deal name is required"],
      trim: true,
      minlength: [2, "Deal name must contain at least 2 characters"],
      maxlength: [150, "Deal name cannot exceed 150 characters"],
    },
    leadReference: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },
    customerReference: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
      index: true,
    },
    assignedEmployee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    dealValue: {
      type: Number,
      required: [true, "Deal value is required"],
      min: [0.01, "Deal value must be greater than zero"],
    },
    probability: {
      type: Number,
      required: [true, "Probability is required"],
      min: [0, "Probability must be between 0 and 100"],
      max: [100, "Probability must be between 0 and 100"],
    },
    expectedRevenue: {
      type: Number,
      required: true,
    },
    expectedClosingDate: {
      type: Date,
      required: [true, "Expected closing date is required"],
      index: true,
    },
    currentStage: {
      type: String,
      enum: {
        values: DEAL_STAGES,
        message: "Invalid deal stage",
      },
      default: "qualification",
      index: true,
    },
    lostReason: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Always calculate expectedRevenue before saving
dealSchema.pre("validate", function () {
  if (this.dealValue !== undefined && this.probability !== undefined) {
    this.expectedRevenue = Number(((this.dealValue * this.probability) / 100).toFixed(2));
  }
});

dealSchema.index({ currentStage: 1, assignedEmployee: 1 });
dealSchema.index({ createdAt: -1 });

const Deal = model<IDeal>("Deal", dealSchema);

export default Deal;
