import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as DashboardService from "./dashboard.service";

const router = Router();
router.use(requireAuth);

const kpiQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
  categoryId:  z.string().uuid().optional(),
});

const opsQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  dateFrom:    z.string().datetime().optional(),
  dateTo:      z.string().datetime().optional(),
});

// GET /dashboard
router.get("/",
  validate({ query: kpiQuerySchema }),
  asyncHandler(async (req, res) => {
    const data = await DashboardService.getDashboardKpis(req.query as any);
    res.json({ data });
  })
);

// GET /dashboard/operations
router.get("/operations",
  validate({ query: opsQuerySchema }),
  asyncHandler(async (req, res) => {
    const data = await DashboardService.getDashboardOperations(req.query as any);
    res.json({ data });
  })
);

export default router;
