import { Router } from "express";

import { register } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate-request.js";
import { createUserSchema } from "../validators/user.validator.js";

const router = Router();

router.post(
  "/register",
  validateBody(createUserSchema),
  register
);

export default router;