import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { idempotency } from "../../middleware/idempotency";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createDeliverySchema, updateDeliverySchema,
  deliveryIdParamSchema, deliveryQuerySchema,
} from "./deliveries.schemas";
import * as DeliveryService from "./deliveries.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/",
  validate({ query: deliveryQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await DeliveryService.listDeliveries(req.query as any);
    res.json(result);
  })
);

router.post("/",
  validate({ body: createDeliverySchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.createDelivery(req.body, payload.sub);
    res.status(201).json({ data });
  })
);

router.get("/:deliveryId",
  validate({ params: deliveryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await DeliveryService.getDelivery(req.params["deliveryId"]!);
    res.json({ data });
  })
);

router.patch("/:deliveryId",
  validate({ params: deliveryIdParamSchema, body: updateDeliverySchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.updateDelivery(req.params["deliveryId"]!, req.body, payload.sub);
    res.json({ data });
  })
);

router.post("/:deliveryId/confirm",
  validate({ params: deliveryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.confirmDelivery(req.params["deliveryId"]!, payload.sub);
    res.json({ data });
  })
);

router.post("/:deliveryId/ready",
  validate({ params: deliveryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.readyDelivery(req.params["deliveryId"]!, payload.sub);
    res.json({ data });
  })
);

router.post("/:deliveryId/validate",
  idempotency(),
  validate({ params: deliveryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.validateDelivery(req.params["deliveryId"]!, payload.sub);
    res.json({ data, message: "Delivery validated successfully" });
  })
);

router.post("/:deliveryId/cancel",
  validate({ params: deliveryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await DeliveryService.cancelDelivery(req.params["deliveryId"]!, payload.sub);
    res.json({ data });
  })
);

export default router;
