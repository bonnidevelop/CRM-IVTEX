import { Router } from "express";
import {
  handleCreateCustomer,
  handleDeleteCustomer,
  handleGetCustomerById,
  handleGetCustomers,
  handleGetCustomerTimeline,
  handleUpdateCustomer,
} from "../controllers/customer.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate-request.js";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listCustomersQuerySchema), handleGetCustomers);
router.post("/", validateBody(createCustomerSchema), handleCreateCustomer);
router.get("/:id", handleGetCustomerById);
router.get("/:id/timeline", handleGetCustomerTimeline);
router.put("/:id", validateBody(updateCustomerSchema), handleUpdateCustomer);
router.delete("/:id", authorize("admin"), handleDeleteCustomer);

export default router;
