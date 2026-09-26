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
import categoriesRouter from "./modules/categories/categories.router";
import stockRouter from "./modules/stock/stock.router";
import reorderingRouter from "./modules/stock/reordering.router";
import deliveriesRouter from "./modules/deliveries/deliveries.router";
import transfersRouter from "./modules/transfers/transfers.router";
import productsRouter from "./modules/products/products.router";
import receiptsRouter from "./modules/receipts/receipts.router";
import ledgerRouter from "./modules/ledger/ledger.router";
import dashboardRouter from "./modules/dashboard/dashboard.router";
import searchRouter from "./modules/search/search.router";
import profileRouter from "./modules/profile/profile.router";

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

// Phase 2: Warehouses & Locations (BE-1)
api.use("/warehouses", warehousesRouter);
api.use("/locations", locationsRouter);

// Phase 2: Categories (BE-2)
api.use("/categories", categoriesRouter);

// Phase 3: Stock & Reordering Rules (BE-2)
api.use("/stock", stockRouter);
api.use("/reordering-rules", reorderingRouter);

// Phase 4: Deliveries & Internal Transfers (BE-2)
api.use("/deliveries", deliveriesRouter);
api.use("/transfers", transfersRouter);

// Phase 3: Products (BE-1)
api.use("/products", productsRouter);

// Phase 4: Receipts (BE-1)
api.use("/receipts", receiptsRouter);

// Phase 5: Inventory Ledger (BE-1)
api.use("/inventory", ledgerRouter);

// Phase 6: Dashboard (BE-1)
api.use("/dashboard", dashboardRouter);

// Phase 7: Search & Profile (BE-1)
api.use("/search",  searchRouter);
api.use("/profile", profileRouter);

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
