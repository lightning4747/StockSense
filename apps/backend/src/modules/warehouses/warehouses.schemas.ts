import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  shortCode: z
    .string()
    .min(1, "Short code is required")
    .max(10, "Short code max 10 characters")
    .regex(/^[A-Z0-9_]+$/, "Short code must be uppercase letters, digits, or underscores"),
  address: z.string().max(1000).optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortCode: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9_]+$/, "Short code must be uppercase letters, digits, or underscores")
    .optional(),
  address: z.string().max(1000).optional(),
});

export const warehouseIdParamSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID"),
});

export type CreateWarehouseBody = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseBody = z.infer<typeof updateWarehouseSchema>;
