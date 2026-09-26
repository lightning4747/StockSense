import { z } from 'zod';

export const stockFilterSchema = z.object({
  search: z.string().optional(),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  categoryId: z.string().optional(),
  stockStatus: z.enum(['all', 'available', 'low', 'out']).default('all'),
});

export type StockFilterValues = z.infer<typeof stockFilterSchema>;
