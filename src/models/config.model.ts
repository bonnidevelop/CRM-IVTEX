import { Schema, model, type Types } from "mongoose";

export interface ICRMConfig {
  companyName: string;
  leadQualificationThreshold?: number;
  dealProbabilityRules: {
    qualification: number;
    discovery: number;
    proposal: number;
    negotiation: number;
    won: number;
    lost: number;
  };
  allowedCurrency: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const crmConfigSchema = new Schema<ICRMConfig>(
  {
    companyName: {
      type: String,
      default: "CRM Enterprise",
      trim: true,
    },
    leadQualificationThreshold: {
      type: Number,
      default: 50,
    },
    dealProbabilityRules: {
      qualification: { type: Number, default: 10 },
      discovery: { type: Number, default: 30 },
      proposal: { type: Number, default: 60 },
      negotiation: { type: Number, default: 80 },
      won: { type: Number, default: 100 },
      lost: { type: Number, default: 0 },
    },
    allowedCurrency: {
      type: String,
      default: "USD",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CRMConfig = model<ICRMConfig>("CRMConfig", crmConfigSchema);

export default CRMConfig;
