import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./modules/auth/auth.router";
import warehousesRouter from "./modules/warehouses/warehouses.router";
import locationsRouter from "./modules/locations/locations.router";

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
// API routes
// ---------------------------------------------------------------------------
const api = express.Router();

// Phase 1: Auth
api.use("/auth", authRouter);

// Phase 2: Warehouses & Locations
api.use("/warehouses", warehousesRouter);
api.use("/locations", locationsRouter);

app.use("/api/v1", api);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    },
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
