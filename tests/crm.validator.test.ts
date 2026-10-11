import { describe, it, expect } from "vitest";
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  convertLeadSchema,
  listLeadsQuerySchema,
} from "../src/validators/lead.validator.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
} from "../src/validators/customer.validator.js";
import {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
  listDealsQuerySchema,
} from "../src/validators/deal.validator.js";
import {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema,
} from "../src/validators/activity.validator.js";
import { updateCRMConfigSchema } from "../src/validators/config.validator.js";
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
} from "../src/validators/user.validator.js";

describe("CRM Comprehensive Validation & Business Rules Test Suite", () => {
  describe("1. Lead Validation & Business Rules", () => {
    it("accepts valid lead with all fields", () => {
      const validLead = {
        name: "Acme Corp Lead",
        email: "lead@acme.com",
        phone: "+1234567890",
        company: "Acme Inc",
        source: "website",
        status: "new",
        priority: "high",
        assignedSalesExecutive: "507f1f77bcf86cd799439011",
        description: "Potential enterprise deal",
      };
      const result = createLeadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it("rejects invalid lead source", () => {
      const invalidLead = {
        name: "Acme Corp Lead",
        email: "lead@acme.com",
        phone: "+1234567890",
        source: "invalid_channel",
      };
      const result = createLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email and short phone numbers", () => {
      const invalid = {
        name: "Acme Corp",
        email: "not-an-email",
        phone: "123",
        source: "email",
      };
      const result = createLeadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates lead status update enum", () => {
      expect(updateLeadStatusSchema.safeParse({ status: "qualified" }).success).toBe(true);
      expect(updateLeadStatusSchema.safeParse({ status: "lost" }).success).toBe(true);
      expect(updateLeadStatusSchema.safeParse({ status: "non_existent_status" }).success).toBe(false);
    });

    it("validates lead assignment schema requires valid ObjectId", () => {
      expect(assignLeadSchema.safeParse({ assignedSalesExecutive: "507f1f77bcf86cd799439011" }).success).toBe(true);
      expect(assignLeadSchema.safeParse({ assignedSalesExecutive: "invalid-id" }).success).toBe(false);
    });

    it("validates lead conversion payload", () => {
      const convertPayload = {
        dealName: "Enterprise Tier Deal",
        dealValue: 50000,
        probability: 70,
        expectedClosingDate: new Date().toISOString(),
        dealStage: "proposal",
        customerAddress: "123 Market St, San Francisco, CA",
      };
      const result = convertLeadSchema.safeParse(convertPayload);
      expect(result.success).toBe(true);
    });

    it("rejects lead conversion with non-positive dealValue", () => {
      const invalidConvert = {
        dealName: "Enterprise Tier Deal",
        dealValue: -100,
        probability: 70,
        expectedClosingDate: new Date().toISOString(),
      };
      const result = convertLeadSchema.safeParse(invalidConvert);
      expect(result.success).toBe(false);
    });

    it("validates lead query filtering parameters", () => {
      const query = {
        page: "2",
        limit: "25",
        status: "contacted",
        priority: "high",
        source: "referral",
        search: "Acme",
        sortOrder: "asc",
      };
      const parsed = listLeadsQuerySchema.safeParse(query);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.limit).toBe(25);
      }
    });
  });

  describe("2. Customer Validation", () => {
    it("accepts valid customer creation", () => {
      const customer = {
        name: "John Enterprise",
        email: "john@enterprise.com",
        phone: "+1555666777",
        company: "Enterprise Global",
        address: "742 Evergreen Terrace",
        status: "active",
      };
      expect(createCustomerSchema.safeParse(customer).success).toBe(true);
    });

    it("validates customer pagination and query filters", () => {
      const query = {
        page: "1",
        limit: "10",
        status: "active",
        search: "John",
        sortBy: "company",
      };
      expect(listCustomersQuerySchema.safeParse(query).success).toBe(true);
    });
  });

  describe("3. Deal Validation & Business Rules", () => {
    it("validates deal creation with positive deal value and valid probability", () => {
      const validDeal = {
        dealName: "Cloud Migration",
        customerReference: "507f1f77bcf86cd799439011",
        dealValue: 12000,
        probability: 50,
        expectedClosingDate: new Date().toISOString(),
        currentStage: "qualification",
      };
      const result = createDealSchema.safeParse(validDeal);
      expect(result.success).toBe(true);
    });

    it("rejects non-positive deal value or probability > 100", () => {
      const invalidDealValue = {
        dealName: "Cloud Migration",
        customerReference: "507f1f77bcf86cd799439011",
        dealValue: 0,
        probability: 50,
        expectedClosingDate: new Date().toISOString(),
      };
      expect(createDealSchema.safeParse(invalidDealValue).success).toBe(false);

      const invalidProb = {
        dealName: "Cloud Migration",
        customerReference: "507f1f77bcf86cd799439011",
        dealValue: 5000,
        probability: 150,
        expectedClosingDate: new Date().toISOString(),
      };
      expect(createDealSchema.safeParse(invalidProb).success).toBe(false);
    });

    it("enforces business rule: Lost deal requires an appropriate reason", () => {
      const missingReason = {
        currentStage: "lost",
      };
      const result = updateDealStageSchema.safeParse(missingReason);
      expect(result.success).toBe(false);

      const withShortReason = {
        currentStage: "lost",
        lostReason: "no",
      };
      expect(updateDealStageSchema.safeParse(withShortReason).success).toBe(false);

      const withValidReason = {
        currentStage: "lost",
        lostReason: "Competitor offered 30% discount",
      };
      expect(updateDealStageSchema.safeParse(withValidReason).success).toBe(true);
    });

    it("validates deal filtering query parameters (amount ranges, stage)", () => {
      const query = {
        stage: "negotiation",
        minAmount: "1000",
        maxAmount: "50000",
        page: "1",
        limit: "20",
      };
      const result = listDealsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minAmount).toBe(1000);
        expect(result.data.maxAmount).toBe(50000);
      }
    });
  });

  describe("4. Sales Activity & Follow-ups Validation", () => {
    it("validates activity creation with correct entity type and valid types", () => {
      const validActivity = {
        type: "meeting",
        title: "Initial Product Demo",
        dueDate: new Date().toISOString(),
        relatedEntityType: "lead",
        relatedEntityId: "507f1f77bcf86cd799439011",
        description: "Review enterprise features",
      };
      expect(createActivitySchema.safeParse(validActivity).success).toBe(true);
    });

    it("rejects invalid activity type or missing entity ID", () => {
      const invalidActivity = {
        type: "unsupported_activity",
        title: "Quick Sync",
        dueDate: new Date().toISOString(),
        relatedEntityType: "lead",
      };
      expect(createActivitySchema.safeParse(invalidActivity).success).toBe(false);
    });

    it("validates activity listing query parameters", () => {
      const query = {
        type: "call",
        status: "pending",
        page: "1",
        limit: "15",
        sortBy: "dueDate",
        sortOrder: "asc",
      };
      expect(listActivitiesQuerySchema.safeParse(query).success).toBe(true);
    });
  });

  describe("5. User Management & CRM Config Validation", () => {
    it("validates user creation with role and password requirements", () => {
      const validUser = {
        name: "Sarah Sales",
        email: "sarah@company.com",
        phone: "+1987654321",
        password: "SecurePassword123!",
        role: "sales_manager",
      };
      expect(createUserSchema.safeParse(validUser).success).toBe(true);
    });

    it("validates status toggle schema", () => {
      expect(updateStatusSchema.safeParse({ isActive: false }).success).toBe(true);
      expect(updateStatusSchema.safeParse({ isActive: "not_a_bool" }).success).toBe(false);
    });

    it("validates CRM configuration rules update", () => {
      const validConfig = {
        companyName: "Acme Global CRM",
        leadQualificationThreshold: 60,
        dealProbabilityRules: {
          qualification: 15,
          discovery: 35,
          proposal: 65,
          negotiation: 85,
          won: 100,
          lost: 0,
        },
        allowedCurrency: "USD",
      };
      expect(updateCRMConfigSchema.safeParse(validConfig).success).toBe(true);
    });
  });
});
