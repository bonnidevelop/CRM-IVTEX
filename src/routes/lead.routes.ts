import { Router } from "express";
import {
  handleAssignLead,
  handleConvertLead,
  handleCreateLead,
  handleDeleteLead,
  handleGetLeadById,
  handleGetLeads,
  handleGetLeadTimeline,
  handleUpdateLead,
  handleUpdateLeadStatus,
} from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate-request.js";
import {
  assignLeadSchema,
  convertLeadSchema,
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from "../validators/lead.validator.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and Create
router.get("/", validateQuery(listLeadsQuerySchema), handleGetLeads);
router.post("/", validateBody(createLeadSchema), handleCreateLead);

// Details and Timeline
router.get("/:id", handleGetLeadById);
router.get("/:id/timeline", handleGetLeadTimeline);

// Updates
router.put("/:id", validateBody(updateLeadSchema), handleUpdateLead);
router.patch("/:id/status", validateBody(updateLeadStatusSchema), handleUpdateLeadStatus);

// Lead Assignment (Admin or Sales Manager)
router.post(
  "/:id/assign",
  authorize("admin", "sales_manager"),
  validateBody(assignLeadSchema),
  handleAssignLead
);

// Lead Conversion (Admin, Sales Manager, or assigned Sales Executive)
router.post(
  "/:id/convert",
  validateBody(convertLeadSchema),
  handleConvertLead
);

// Delete (Admin only)
router.delete("/:id", authorize("admin"), handleDeleteLead);

export default router;
