import { eq, ilike, count, and, sql } from "drizzle-orm";
import { db } from "../../db";
import { categories, products } from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import type { CreateCategoryBody, UpdateCategoryBody } from "./categories.schemas";

// ---------------------------------------------------------------------------
// List categories — paginated, searchable, with productCount
// ---------------------------------------------------------------------------
export async function listCategories(page: number, limit: number, search?: string) {
  const conditions = [
    eq(categories.isActive, true),
    search ? ilike(categories.name, `%${search}%`) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count(categories.id) })
    .from(categories)
    .where(whereClause);

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      productCount: sql<number>`cast(count(${products.id}) as int)`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true))
    )
    .where(whereClause)
    .groupBy(categories.id, categories.name)
    .limit(limit)
    .offset(getOffset(page, limit));

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(total)),
  };
}

// ---------------------------------------------------------------------------
// Get single category
// ---------------------------------------------------------------------------
export async function getCategory(categoryId: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.isActive, true)))
    .limit(1);

  if (!category) {
    throw new AppError("Category not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return category;
}

// ---------------------------------------------------------------------------
// Create category
// ---------------------------------------------------------------------------
export async function createCategory(body: CreateCategoryBody, userId: string) {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, body.name))
    .limit(1);

  if (existing) {
    throw new AppError(
      `Category "${body.name}" already exists.`,
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const [created] = await db
    .insert(categories)
    .values({ name: body.name, createdBy: userId, updatedBy: userId })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Update category
// ---------------------------------------------------------------------------
export async function updateCategory(
  categoryId: string,
  body: UpdateCategoryBody,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Category not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (body.name !== existing.name) {
    const [conflict] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, body.name))
      .limit(1);

    if (conflict) {
      throw new AppError(
        `Category "${body.name}" already exists.`,
        409,
        ERROR_CODES.CONFLICT
      );
    }
  }

  const [updated] = await db
    .update(categories)
    .set({ name: body.name, updatedAt: new Date(), updatedBy: userId })
    .where(eq(categories.id, categoryId))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Delete category — blocked if any active products are assigned
// ---------------------------------------------------------------------------
export async function deleteCategory(categoryId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Category not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const [productCheck] = await db
    .select({ c: count(products.id) })
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));

  if (productCheck && Number(productCheck.c) > 0) {
    throw new AppError(
      "Cannot delete category with assigned products. Reassign products first.",
      409,
      ERROR_CODES.OPERATION_BLOCKED
    );
  }

  await db
    .update(categories)
    .set({ isActive: false, updatedAt: new Date(), updatedBy: userId })
    .where(eq(categories.id, categoryId));
}
