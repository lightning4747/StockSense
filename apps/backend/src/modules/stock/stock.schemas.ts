import { z } from "zod";

export const stockQuerySchema = z.object({
  page:        z.string().optional().default("1").transform(Number),
  limit:       z.string().optional().default("20").transform(Number),
  search:      z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
  categoryId:  z.string().uuid().optional(),
  productId:   z.string().uuid().optional(),
  stockStatus: z.enum(["all", "available", "low", "out"]).optional().default("all"),
});

export const stockProductParamSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export const adjustmentSchema = z.object({
  productId:       z.string().uuid("Invalid product ID"),
  locationId:      z.string().uuid("Invalid location ID"),
  countedQuantity: z.number().int().min(0, "Counted quantity cannot be negative"),
  reason:          z.string().min(1, "Reason is required").max(500),
});

export type StockQuery      = z.infer<typeof stockQuerySchema>;
export type AdjustmentBody  = z.infer<typeof adjustmentSchema>;
