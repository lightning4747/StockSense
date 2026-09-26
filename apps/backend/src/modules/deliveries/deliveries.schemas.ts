import { z } from "zod";

const deliveryItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity:  z.number().int().min(1, "Quantity must be at least 1"),
});

export const createDeliverySchema = z.object({
  warehouseId:      z.string().uuid("Invalid warehouse ID"),
  sourceLocationId: z.string().uuid("Invalid location ID"),
  deliveryAddress:  z.string().max(500).optional(),
  scheduledAt:      z.string().datetime().optional(),
  items:            z.array(deliveryItemSchema).min(1, "At least one item is required"),
});

export const updateDeliverySchema = z.object({
  sourceLocationId: z.string().uuid().optional(),
  deliveryAddress:  z.string().max(500).optional(),
  scheduledAt:      z.string().datetime().optional(),
  items:            z.array(deliveryItemSchema).min(1).optional(),
});

export const deliveryIdParamSchema = z.object({
  deliveryId: z.string().uuid("Invalid delivery ID"),
});

export const deliveryQuerySchema = z.object({
  page:        z.string().optional().default("1").transform(Number),
  limit:       z.string().optional().default("20").transform(Number),
  search:      z.string().optional(),
  status:      z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
  dateFrom:    z.string().datetime().optional(),
  dateTo:      z.string().datetime().optional(),
});

export type CreateDeliveryBody = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryBody = z.infer<typeof updateDeliverySchema>;
