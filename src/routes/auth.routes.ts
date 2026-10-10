import { Router } from "express";
import { register,login,me } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate-request.js";
import { createUserSchema } from "../validators/user.validator.js";
import { loginSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";


const router = Router();

router.post(
  "/register",
  validateBody(createUserSchema),
  register
);

router.post(
  "/login",
  validateBody(loginSchema),
  login
);

router.get("/me", authenticate, me);

export default router;