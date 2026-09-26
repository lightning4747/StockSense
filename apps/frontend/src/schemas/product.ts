import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .max(20, 'SKU cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  categoryId: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  costPerUnit: z.coerce.number().min(0, 'Cost per unit must be a non-negative number'),
  reorderPoint: z.coerce.number().int().min(0, 'Reorder point must be at least 0'),
  reorderQuantity: z.coerce.number().int().min(1, 'Reorder quantity must be at least 1'),
  initialStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').optional(),
  initialLocationId: z.string().optional(),
}).refine(
  (data) => {
    if (data.initialStock && data.initialStock > 0) {
      return Boolean(data.initialLocationId && data.initialLocationId.trim().length > 0);
    }
    return true;
  },
  {
    message: 'Destination location is required when initial stock is greater than 0',
    path: ['initialLocationId'],
  }
);

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  costPerUnit: z.coerce.number().min(0, 'Cost per unit must be a non-negative number'),
  reorderPoint: z.coerce.number().int().min(0, 'Reorder point must be at least 0'),
  reorderQuantity: z.coerce.number().int().min(1, 'Reorder quantity must be at least 1'),
});

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

export const reorderingRuleSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  locationId: z.string().min(1, 'Location is required'),
  minQuantity: z.coerce.number().int().min(0, 'Minimum quantity must be at least 0'),
  maxQuantity: z.coerce.number().int().min(1, 'Maximum quantity must be at least 1'),
}).refine((data) => data.maxQuantity >= data.minQuantity, {
  message: 'Maximum quantity must be greater than or equal to minimum quantity',
  path: ['maxQuantity'],
});

export type ReorderingRuleFormValues = z.infer<typeof reorderingRuleSchema>;
