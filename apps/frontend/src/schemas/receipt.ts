import { z } from 'zod';

export const receiptItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const createReceiptSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  destinationLocationId: z.string().min(1, 'Destination location is required'),
  supplierName: z.string().min(2, 'Supplier / Vendor name must be at least 2 characters'),
  scheduledAt: z.string().min(1, 'Scheduled date is required'),
  items: z.array(receiptItemSchema).min(1, 'At least one product line item is required'),
});

export type CreateReceiptFormValues = z.infer<typeof createReceiptSchema>;

export const updateReceiptSchema = z.object({
  destinationLocationId: z.string().min(1, 'Destination location is required'),
  supplierName: z.string().min(2, 'Supplier / Vendor name must be at least 2 characters'),
  scheduledAt: z.string().min(1, 'Scheduled date is required'),
  items: z.array(receiptItemSchema).min(1, 'At least one product line item is required'),
});

export type UpdateReceiptFormValues = z.infer<typeof updateReceiptSchema>;
