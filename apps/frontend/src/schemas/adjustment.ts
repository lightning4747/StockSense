import { z } from 'zod';

export const createAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  locationId: z.string().min(1, 'Location is required'),
  countedQuantity: z.coerce
    .number({ invalid_type_error: 'Counted quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(0, 'Counted quantity cannot be negative'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long'),
});

export type CreateAdjustmentFormValues = z.infer<typeof createAdjustmentSchema>;
