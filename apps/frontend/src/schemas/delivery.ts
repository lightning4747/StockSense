import { z } from 'zod';

export const deliveryItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const createDeliverySchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  sourceLocationId: z.string().min(1, 'Source location is required'),
  deliveryAddress: z.string().max(500, 'Address is too long').optional().default(''),
  scheduledAt: z.string().optional().default(''),
  items: z.array(deliveryItemSchema).min(1, 'At least one line item is required'),
});

export type CreateDeliveryFormValues = z.infer<typeof createDeliverySchema>;

export const updateDeliverySchema = z.object({
  sourceLocationId: z.string().min(1, 'Source location is required').optional(),
  deliveryAddress: z.string().max(500, 'Address is too long').optional(),
  scheduledAt: z.string().optional(),
  items: z.array(deliveryItemSchema).min(1, 'At least one line item is required').optional(),
});

export type UpdateDeliveryFormValues = z.infer<typeof updateDeliverySchema>;
