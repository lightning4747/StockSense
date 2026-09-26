import { z } from "zod";

export const createLocationSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  name: z.string().min(1, "Name is required").max(255),
  shortCode: z
    .string()
    .min(1, "Short code is required")
    .max(10, "Short code max 10 characters")
    .regex(/^[A-Z0-9_]+$/, "Short code must be uppercase letters, digits, or underscores"),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortCode: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9_]+$/, "Short code must be uppercase letters, digits, or underscores")
    .optional(),
});

export const locationIdParamSchema = z.object({
  locationId: z.string().uuid("Invalid location ID"),
});

export const locationQuerySchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  search: z.string().optional(),
});

export type CreateLocationBody = z.infer<typeof createLocationSchema>;
export type UpdateLocationBody = z.infer<typeof updateLocationSchema>;
