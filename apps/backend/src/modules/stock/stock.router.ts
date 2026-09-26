import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { idempotency } from "../../middleware/idempotency";
import { asyncHandler } from "../../utils/asyncHandler";
import { stockQuerySchema, stockProductParamSchema, adjustmentSchema } from "./stock.schemas";
import * as StockService from "./stock.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /stock
router.get(
  "/",
  validate({ query: stockQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await StockService.listStock(req.query as any);
    res.json(result);
  })
);

// GET /stock/:productId
router.get(
  "/:productId",
  validate({ params: stockProductParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await StockService.getStockByProduct(req.params["productId"]!);
    res.json({ data });
  })
);

// POST /stock/adjustments  (idempotency required)
router.post(
  "/adjustments",
  idempotency(),
  validate({ body: adjustmentSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await StockService.createAdjustment(req.body, payload.sub);
    res.status(200).json({ data, message: "Stock adjusted successfully" });
  })
);

export default router;
