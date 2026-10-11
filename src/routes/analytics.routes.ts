import { Router } from "express";
import {
  handleGetDashboardMetrics,
  handleGetSalesPipeline,
  handleGetTeamPerformance,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(authenticate);

// General CRM metrics (Admin, Sales Manager, Sales Executive)
router.get("/metrics", handleGetDashboardMetrics);

// Sales Pipeline metrics
router.get("/pipeline", handleGetSalesPipeline);

// Team Performance (Manager & Admin only)
router.get(
  "/team-performance",
  authorize("admin", "sales_manager"),
  handleGetTeamPerformance
);

export default router;
