import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { idempotency } from "../../middleware/idempotency";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createReceiptSchema, updateReceiptSchema,
  receiptIdParamSchema, receiptQuerySchema,
} from "./receipts.schemas";
import * as ReceiptService from "./receipts.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/",
  validate({ query: receiptQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await ReceiptService.listReceipts(req.query as any);
    res.json(result);
  })
);

router.post("/",
  validate({ body: createReceiptSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReceiptService.createReceipt(req.body, payload.sub);
    res.status(201).json({ data });
  })
);

router.get("/:receiptId",
  validate({ params: receiptIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await ReceiptService.getReceipt(req.params["receiptId"]!);
    res.json({ data });
  })
);

router.patch("/:receiptId",
  validate({ params: receiptIdParamSchema, body: updateReceiptSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReceiptService.updateReceipt(req.params["receiptId"]!, req.body, payload.sub);
    res.json({ data });
  })
);

router.post("/:receiptId/ready",
  validate({ params: receiptIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReceiptService.readyReceipt(req.params["receiptId"]!, payload.sub);
    res.json({ data, message: "Receipt is ready" });
  })
);

router.post("/:receiptId/validate",
  idempotency(),
  validate({ params: receiptIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReceiptService.validateReceipt(req.params["receiptId"]!, payload.sub);
    res.json({ data, message: "Receipt validated successfully" });
  })
);

router.post("/:receiptId/cancel",
  validate({ params: receiptIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ReceiptService.cancelReceipt(req.params["receiptId"]!, payload.sub);
    res.json({ data });
  })
);

export default router;
