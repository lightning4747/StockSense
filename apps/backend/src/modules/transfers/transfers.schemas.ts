import { z } from "zod";

const transferItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity:  z.number().int().min(1, "Quantity must be at least 1"),
});

export const createTransferSchema = z.object({
  warehouseId:            z.string().uuid("Invalid warehouse ID"),
  sourceLocationId:       z.string().uuid("Invalid source location ID"),
  destinationLocationId:  z.string().uuid("Invalid destination location ID"),
  scheduledAt:            z.string().datetime().optional(),
  items:                  z.array(transferItemSchema).min(1, "At least one item is required"),
}).refine(
  (d) => d.sourceLocationId !== d.destinationLocationId,
  { message: "Source and destination locations must differ", path: ["destinationLocationId"] }
);

export const updateTransferSchema = z.object({
  sourceLocationId:      z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  scheduledAt:           z.string().datetime().optional(),
  items:                 z.array(transferItemSchema).min(1).optional(),
});

export const transferIdParamSchema = z.object({
  transferId: z.string().uuid("Invalid transfer ID"),
});

export const transferQuerySchema = z.object({
  page:                  z.string().optional().default("1").transform(Number),
  limit:                 z.string().optional().default("20").transform(Number),
  search:                z.string().optional(),
  status:                z.string().optional(),
  warehouseId:           z.string().uuid().optional(),
  sourceLocationId:      z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  dateFrom:              z.string().datetime().optional(),
  dateTo:                z.string().datetime().optional(),
});

export type CreateTransferBody = z.infer<typeof createTransferSchema>;
export type UpdateTransferBody = z.infer<typeof updateTransferSchema>;
