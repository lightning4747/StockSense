import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(2, 'Warehouse name must be at least 2 characters')
    .max(60, 'Warehouse name cannot exceed 60 characters')
    .trim(),
  shortCode: z
    .string()
    .min(2, 'Short code must be at least 2 characters')
    .max(6, 'Short code cannot exceed 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Short code must be uppercase letters and numbers only')
    .trim(),
  address: z
    .string()
    .max(250, 'Address cannot exceed 250 characters')
    .optional()
    .or(z.literal('')),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;

export const locationSchema = z.object({
  name: z
    .string()
    .min(2, 'Location name must be at least 2 characters')
    .max(60, 'Location name cannot exceed 60 characters')
    .trim(),
  shortCode: z
    .string()
    .min(2, 'Short code must be at least 2 characters')
    .max(10, 'Short code cannot exceed 10 characters')
    .regex(/^[A-Z0-9_]+$/, 'Short code must be uppercase letters, numbers, or underscores')
    .trim(),
  warehouseId: z.string().min(1, 'Please select a parent warehouse'),
});

export type LocationFormData = z.infer<typeof locationSchema>;
