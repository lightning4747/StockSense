import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createReorderingRuleSchema,
  updateReorderingRuleSchema,
  reorderingRuleIdParamSchema,
  reorderingRuleQuerySchema,
} from "./reordering.schemas";
import * as ReorderingService from "./reordering.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /reordering-rules
router.get(
  "/",
  validate({ query: reorderingRuleQuerySchema }),
  asyncHandler(async (req, res) => {
    const { productId, warehouseId, locationId } = req.query as {
      productId?: string; warehouseId?: string; locationId?: string;
    };
    const data = await ReorderingService.listReorderingRules(productId, warehouseId, locationId);
    res.json({ data });
  })
);

// POST /reordering-rules
router.post(
  "/",
  validate({ body: createReorderingRuleSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReorderingService.createReorderingRule(req.body, payload.sub);
    res.status(201).json({ data, message: "Reordering rule created successfully" });
  })
);

// PATCH /reordering-rules/:ruleId
router.patch(
  "/:ruleId",
  validate({ params: reorderingRuleIdParamSchema, body: updateReorderingRuleSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReorderingService.updateReorderingRule(
      req.params["ruleId"]!,
      req.body,
      payload.sub
    );
    res.json({ data, message: "Reordering rule updated successfully" });
  })
);

// DELETE /reordering-rules/:ruleId
router.delete(
  "/:ruleId",
  validate({ params: reorderingRuleIdParamSchema }),
  asyncHandler(async (req, res) => {
    await ReorderingService.deleteReorderingRule(req.params["ruleId"]!);
    res.json({ data: null, message: "Reordering rule deleted successfully" });
  })
);

export default router;
