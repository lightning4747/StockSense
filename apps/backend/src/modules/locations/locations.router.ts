import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createLocationSchema,
  updateLocationSchema,
  locationIdParamSchema,
  locationQuerySchema,
} from "./locations.schemas";
import * as LocationService from "./locations.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();

// All location routes require authentication
router.use(requireAuth);

// GET /locations?warehouseId=&search=
router.get(
  "/",
  validate({ query: locationQuerySchema }),
  asyncHandler(async (req, res) => {
    const { warehouseId, search } = req.query as {
      warehouseId?: string;
      search?: string;
    };
    const data = await LocationService.listLocations(warehouseId, search);
    res.json({ data });
  })
);

// POST /locations
router.post(
  "/",
  validate({ body: createLocationSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await LocationService.createLocation(req.body, payload.sub);
    res.status(201).json({ data, message: "Location created successfully" });
  })
);

// GET /locations/:locationId
router.get(
  "/:locationId",
  validate({ params: locationIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await LocationService.getLocation(req.params["locationId"]!);
    res.json({ data });
  })
);

// PATCH /locations/:locationId
router.patch(
  "/:locationId",
  validate({ params: locationIdParamSchema, body: updateLocationSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await LocationService.updateLocation(
      req.params["locationId"]!,
      req.body,
      payload.sub
    );
    res.json({ data, message: "Location updated successfully" });
  })
);

// DELETE /locations/:locationId
router.delete(
  "/:locationId",
  validate({ params: locationIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    await LocationService.deleteLocation(req.params["locationId"]!, payload.sub);
    res.json({ data: null, message: "Location deleted successfully" });
  })
);

export default router;
