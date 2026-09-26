import { z } from "zod";

const receiptItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity:  z.number().int().min(1, "Quantity must be at least 1"),
});

export const createReceiptSchema = z.object({
  warehouseId:           z.string().uuid("Invalid warehouse ID"),
  destinationLocationId: z.string().uuid("Invalid location ID"),
  supplierName:          z.string().max(255).optional(),
  scheduledAt:           z.string().datetime().optional(),
  items:                 z.array(receiptItemSchema).min(1, "At least one item required"),
});

export const updateReceiptSchema = z.object({
  destinationLocationId: z.string().uuid().optional(),
  supplierName:          z.string().max(255).optional(),
  scheduledAt:           z.string().datetime().optional(),
  items:                 z.array(receiptItemSchema).min(1).optional(),
});

export const receiptIdParamSchema = z.object({
  receiptId: z.string().uuid("Invalid receipt ID"),
});

export const receiptQuerySchema = z.object({
  page:        z.string().optional().default("1").transform(Number),
  limit:       z.string().optional().default("20").transform(Number),
  search:      z.string().optional(),
  status:      z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
  dateFrom:    z.string().datetime().optional(),
  dateTo:      z.string().datetime().optional(),
  sortBy:      z.string().optional(),
  sortOrder:   z.enum(["asc", "desc"]).optional().default("asc"),
});

export type CreateReceiptBody = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptBody = z.infer<typeof updateReceiptSchema>;
