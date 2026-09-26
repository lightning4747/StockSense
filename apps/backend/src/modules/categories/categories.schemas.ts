import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255),
});

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
});

export const categoryQuerySchema = z.object({
  page:   z.string().optional().default("1").transform(Number),
  limit:  z.string().optional().default("20").transform(Number),
  search: z.string().optional(),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
