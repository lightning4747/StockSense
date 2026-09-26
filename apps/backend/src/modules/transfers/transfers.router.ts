import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { idempotency } from "../../middleware/idempotency";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createTransferSchema, updateTransferSchema,
  transferIdParamSchema, transferQuerySchema,
} from "./transfers.schemas";
import * as TransferService from "./transfers.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/",
  validate({ query: transferQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await TransferService.listTransfers(req.query as any);
    res.json(result);
  })
);

router.post("/",
  validate({ body: createTransferSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await TransferService.createTransfer(req.body, payload.sub);
    res.status(201).json({ data });
  })
);

router.get("/:transferId",
  validate({ params: transferIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await TransferService.getTransfer(req.params["transferId"]!);
    res.json({ data });
  })
);

router.patch("/:transferId",
  validate({ params: transferIdParamSchema, body: updateTransferSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await TransferService.updateTransfer(req.params["transferId"]!, req.body, payload.sub);
    res.json({ data });
  })
);

router.post("/:transferId/ready",
  validate({ params: transferIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await TransferService.readyTransfer(req.params["transferId"]!, payload.sub);
    res.json({ data });
  })
);

router.post("/:transferId/validate",
  idempotency(),
  validate({ params: transferIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await TransferService.validateTransfer(req.params["transferId"]!, payload.sub);
    res.json({ data, message: "Transfer validated successfully" });
  })
);

router.post("/:transferId/cancel",
  validate({ params: transferIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await TransferService.cancelTransfer(req.params["transferId"]!, payload.sub);
    res.json({ data });
  })
);

export default router;
