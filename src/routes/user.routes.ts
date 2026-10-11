import { Router } from "express";
import {
  getUsers,
  getUser,
  handleCreateUser,
  handleDeleteUser,
  handleUpdateUser,
  handleUpdateUserStatus,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate-request.js";
import { listUsersQuerySchema } from "../validators/user-query.validator.js";
import {
  createUserSchema,
  updateStatusSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

const router = Router();

// All user management routes require admin role
router.use(authenticate, authorize("admin"));

router.get("/", validateQuery(listUsersQuerySchema), getUsers);
router.post("/", validateBody(createUserSchema), handleCreateUser);
router.get("/:id", getUser);
router.put("/:id", validateBody(updateUserSchema), handleUpdateUser);
router.patch("/:id/status", validateBody(updateStatusSchema), handleUpdateUserStatus);
router.delete("/:id", handleDeleteUser);

export default router;