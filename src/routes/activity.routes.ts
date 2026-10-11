import { Router } from "express";
import {
  handleCompleteActivity,
  handleCreateActivity,
  handleDeleteActivity,
  handleGetActivities,
  handleGetActivityById,
  handleUpdateActivity,
} from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate-request.js";
import {
  createActivitySchema,
  listActivitiesQuerySchema,
  updateActivitySchema,
} from "../validators/activity.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listActivitiesQuerySchema), handleGetActivities);
router.post("/", validateBody(createActivitySchema), handleCreateActivity);
router.get("/:id", handleGetActivityById);
router.put("/:id", validateBody(updateActivitySchema), handleUpdateActivity);
router.patch("/:id/complete", handleCompleteActivity);
router.delete("/:id", authorize("admin", "sales_manager"), handleDeleteActivity);

export default router;
