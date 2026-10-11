import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppError } from "./utils/app-error.js";
import { sendSuccess } from "./utils/api-response.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import dealRoutes from "./routes/deal.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import configRoutes from "./routes/config.routes.js";

const app = express();

// Security headers
app.use(helmet());

// Cross-origin request configuration
const allowedOrigins = (
  process.env.CORS_ORIGIN ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// Basic API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Health-check endpoint
app.get("/api/v1/health", (_req, res) => {
  sendSuccess(
    res,
    "CRM Sales Management API is running",
    { status: "healthy" }
  );
});

// CRM Endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/config", configRoutes);

// Handle unmatched routes
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

// Error handler 
app.use(errorHandler);

export default app;