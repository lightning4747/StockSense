import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdParamSchema,
} from "./warehouses.schemas";
import * as WarehouseService from "./warehouses.service";
import type { AuthPayload } from "../../middleware/auth";
import { z } from "zod";

const router = Router();

// All warehouse routes require authentication
router.use(requireAuth);

// GET /warehouses
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
    const data = await WarehouseService.listWarehouses(search);
    res.json({ data });
  })
);

// POST /warehouses
router.post(
  "/",
  validate({ body: createWarehouseSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await WarehouseService.createWarehouse(req.body, payload.sub);
    res.status(201).json({ data, message: "Warehouse created successfully" });
  })
);

// GET /warehouses/:warehouseId
router.get(
  "/:warehouseId",
  validate({ params: warehouseIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await WarehouseService.getWarehouse(req.params["warehouseId"]!);
    res.json({ data });
  })
);

// PATCH /warehouses/:warehouseId
router.patch(
  "/:warehouseId",
  validate({ params: warehouseIdParamSchema, body: updateWarehouseSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await WarehouseService.updateWarehouse(
      req.params["warehouseId"]!,
      req.body,
      payload.sub
    );
    res.json({ data, message: "Warehouse updated successfully" });
  })
);

// DELETE /warehouses/:warehouseId
router.delete(
  "/:warehouseId",
  validate({ params: warehouseIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    await WarehouseService.deleteWarehouse(req.params["warehouseId"]!, payload.sub);
    res.json({ data: null, message: "Warehouse deleted successfully" });
  })
);

export default router;
