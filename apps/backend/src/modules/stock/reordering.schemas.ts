import { z } from "zod";

export const createReorderingRuleSchema = z.object({
  productId:       z.string().uuid("Invalid product ID"),
  warehouseId:     z.string().uuid("Invalid warehouse ID"),
  locationId:      z.string().uuid("Invalid location ID"),
  reorderPoint:    z.number().int().min(0),
  reorderQuantity: z.number().int().min(1),
  enabled:         z.boolean().optional().default(true),
});

export const updateReorderingRuleSchema = z.object({
  reorderPoint:    z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(1).optional(),
  enabled:         z.boolean().optional(),
});

export const reorderingRuleIdParamSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID"),
});

export const reorderingRuleQuerySchema = z.object({
  productId:   z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId:  z.string().uuid().optional(),
});

export type CreateReorderingRuleBody = z.infer<typeof createReorderingRuleSchema>;
export type UpdateReorderingRuleBody = z.infer<typeof updateReorderingRuleSchema>;
