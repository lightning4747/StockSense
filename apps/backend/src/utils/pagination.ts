import { z } from "zod";

/** Zod schema for common pagination query params */
export const paginationSchema = z.object({
  page:  z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/** Computes OFFSET from page + limit */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/** Builds the pagination metadata block returned in list responses */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
