import { Router } from "express";
import {
  handleCreateDeal,
  handleDeleteDeal,
  handleGetDealById,
  handleGetDeals,
  handleGetDealTimeline,
  handleUpdateDeal,
  handleUpdateDealStage,
} from "../controllers/deal.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate-request.js";
import {
  createDealSchema,
  listDealsQuerySchema,
  updateDealSchema,
  updateDealStageSchema,
} from "../validators/deal.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listDealsQuerySchema), handleGetDeals);
router.post("/", validateBody(createDealSchema), handleCreateDeal);
router.get("/:id", handleGetDealById);
router.get("/:id/timeline", handleGetDealTimeline);
router.put("/:id", validateBody(updateDealSchema), handleUpdateDeal);
router.patch("/:id/stage", validateBody(updateDealStageSchema), handleUpdateDealStage);
router.delete("/:id", authorize("admin"), handleDeleteDeal);

export default router;
