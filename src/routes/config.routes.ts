import { Router } from "express";
import {
  handleGetConfig,
  handleUpdateConfig,
} from "../controllers/config.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate-request.js";
import { updateCRMConfigSchema } from "../validators/config.validator.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", handleGetConfig);
router.put("/", validateBody(updateCRMConfigSchema), handleUpdateConfig);

export default router;
