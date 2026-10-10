import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppError } from "./utils/app-error.js";
import { sendSuccess } from "./utils/api-response.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";

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

app.use("/api/v1/auth", authRoutes);

// Handle unmatched routes
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

// Error handler 
app.use(errorHandler);

export default app;