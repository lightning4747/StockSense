import { z } from 'zod';

export const transferItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const createTransferSchema = z
  .object({
    warehouseId: z.string().min(1, 'Warehouse is required'),
    sourceLocationId: z.string().min(1, 'Source location is required'),
    destinationLocationId: z.string().min(1, 'Destination location is required'),
    scheduledAt: z.string().optional().default(''),
    items: z.array(transferItemSchema).min(1, 'At least one line item is required'),
  })
  .refine((data) => data.sourceLocationId !== data.destinationLocationId, {
    message: 'Source and destination locations must differ',
    path: ['destinationLocationId'],
  });

export type CreateTransferFormValues = z.infer<typeof createTransferSchema>;

export const updateTransferSchema = z.object({
  sourceLocationId: z.string().min(1, 'Source location is required').optional(),
  destinationLocationId: z.string().min(1, 'Destination location is required').optional(),
  scheduledAt: z.string().optional(),
  items: z.array(transferItemSchema).min(1, 'At least one line item is required').optional(),
});

export type UpdateTransferFormValues = z.infer<typeof updateTransferSchema>;
