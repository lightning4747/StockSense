import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as LedgerService from "./ledger.service";

const router = Router();
router.use(requireAuth);

const movesQuerySchema = z.object({
  page:         z.string().optional().default("1").transform(Number),
  limit:        z.string().optional().default("20").transform(Number),
  search:       z.string().optional(),
  reference:    z.string().optional(),
  productId:    z.string().uuid().optional(),
  warehouseId:  z.string().uuid().optional(),
  locationId:   z.string().uuid().optional(),
  movementType: z.enum(["IN", "OUT", "TRANSFER_OUT", "TRANSFER_IN", "ADJUSTMENT"]).optional(),
  dateFrom:     z.string().datetime().optional(),
  dateTo:       z.string().datetime().optional(),
});

const moveIdParamSchema = z.object({
  moveId: z.string().uuid("Invalid move ID"),
});

// GET /inventory/moves
router.get("/moves",
  validate({ query: movesQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await LedgerService.listMoves(req.query as any);
    res.json(result);
  })
);

// GET /inventory/moves/:moveId
router.get("/moves/:moveId",
  validate({ params: moveIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await LedgerService.getMove(req.params["moveId"]!);
    res.json({ data });
  })
);

export default router;
