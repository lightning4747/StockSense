import { z } from "zod";

export const createProductSchema = z.object({
  name:              z.string().min(1).max(255),
  sku:               z.string().min(1).max(100),
  categoryId:        z.string().uuid().optional(),
  unitOfMeasure:     z.string().min(1).max(50),
  costPerUnit:       z.number().positive().optional(),
  reorderPoint:      z.number().int().min(0).optional().default(0),
  reorderQuantity:   z.number().int().min(0).optional().default(0),
  initialStock:      z.number().int().min(0).optional().default(0),
  initialLocationId: z.string().uuid().optional(),
}).refine(
  (d) => d.initialStock === 0 || !!d.initialLocationId,
  { message: "initialLocationId is required when initialStock > 0", path: ["initialLocationId"] }
);

export const updateProductSchema = z.object({
  name:            z.string().min(1).max(255).optional(),
  categoryId:      z.string().uuid().optional(),
  unitOfMeasure:   z.string().min(1).max(50).optional(),
  costPerUnit:     z.number().positive().optional(),
  reorderPoint:    z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export const productQuerySchema = z.object({
  page:        z.string().optional().default("1").transform(Number),
  limit:       z.string().optional().default("20").transform(Number),
  search:      z.string().optional(),
  sku:         z.string().optional(),
  categoryId:  z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
  stockStatus: z.enum(["all", "low", "out", "available"]).optional().default("all"),
  sortBy:      z.string().optional().default("name"),
  sortOrder:   z.enum(["asc", "desc"]).optional().default("asc"),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
