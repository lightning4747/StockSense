import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ---------------------------------------------------------------------------
// Security & general middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimiter);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// API routes (mounted per phase)
// ---------------------------------------------------------------------------
// Phase 1: Auth — imported in phase-1 branch
// app.use("/api/auth", authRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: "The requested resource was not found.",
  });
});

// ---------------------------------------------------------------------------
// Centralized error handler (must be last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 StockSense API running on port ${PORT} [${env.NODE_ENV}]`);
});

export default app;
