import { eq, and, ilike, count, sql, asc, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  products, categories, stockLevels, locations,
  inventoryLedger, warehouses,
} from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import { generateReference } from "../../utils/referenceGenerator";
import type { CreateProductBody, UpdateProductBody } from "./products.schemas";

// ---------------------------------------------------------------------------
// List products — paginated, filterable
// ---------------------------------------------------------------------------
export async function listProducts(q: {
  page: number; limit: number; search?: string; sku?: string;
  categoryId?: string; warehouseId?: string; locationId?: string;
  stockStatus: string; sortBy: string; sortOrder: string;
}) {
  const wheres = [
    eq(products.isActive, true),
    q.search     ? ilike(products.name, `%${q.search}%`) : undefined,
    q.sku        ? ilike(products.sku,  `%${q.sku}%`)    : undefined,
    q.categoryId ? eq(products.categoryId, q.categoryId) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const orderCol = q.sortBy === "sku" ? products.sku
    : q.sortBy === "createdAt"        ? products.createdAt
    : products.name;
  const orderDir = q.sortOrder === "desc" ? desc(orderCol) : asc(orderCol);

  const [{ total }] = await db
    .select({ total: count(products.id) })
    .from(products)
    .where(and(...wheres));

  const rows = await db
    .select({
      id:            products.id,
      sku:           products.sku,
      name:          products.name,
      categoryId:    products.categoryId,
      categoryName:  categories.name,
      unitOfMeasure: products.unitOfMeasure,
      costPerUnit:   products.costPerUnit,
      reorderPoint:  products.reorderPoint,
      onHand:        sql<number>`coalesce(sum(${stockLevels.onHand}), 0)`,
      reserved:      sql<number>`coalesce(sum(${stockLevels.reserved}), 0)`,
    })
    .from(products)
    .leftJoin(categories,   eq(products.categoryId, categories.id))
    .leftJoin(stockLevels,  eq(stockLevels.productId, products.id))
    .leftJoin(locations,    eq(stockLevels.locationId, locations.id))
    .where(and(...wheres))
    .groupBy(products.id, categories.name)
    .orderBy(orderDir)
    .limit(q.limit)
    .offset(getOffset(q.page, q.limit));

  const mapped = rows.map((r) => ({
    ...r,
    freeToUse: r.onHand - r.reserved,
    category: r.categoryId ? { id: r.categoryId, name: r.categoryName } : null,
  }));

  // stock status post-filter
  const filtered = q.stockStatus === "out"       ? mapped.filter((r) => r.onHand === 0)
    : q.stockStatus === "low"                    ? mapped.filter((r) => r.onHand > 0 && r.onHand <= r.reorderPoint)
    : q.stockStatus === "available"              ? mapped.filter((r) => r.onHand > r.reorderPoint)
    : mapped;

  return { data: filtered, pagination: buildPaginationMeta(q.page, q.limit, Number(total)) };
}

// ---------------------------------------------------------------------------
// Get single product
// ---------------------------------------------------------------------------
export async function getProduct(productId: string) {
  const [product] = await db
    .select({
      id:              products.id,
      sku:             products.sku,
      name:            products.name,
      categoryId:      products.categoryId,
      categoryName:    categories.name,
      unitOfMeasure:   products.unitOfMeasure,
      costPerUnit:     products.costPerUnit,
      reorderPoint:    products.reorderPoint,
      reorderQuantity: products.reorderQuantity,
      isActive:        products.isActive,
      createdAt:       products.createdAt,
      updatedAt:       products.updatedAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);

  return {
    ...product,
    category: product.categoryId ? { id: product.categoryId, name: product.categoryName } : null,
  };
}

// ---------------------------------------------------------------------------
// Create product — with optional initial stock (atomic tx)
// ---------------------------------------------------------------------------
export async function createProduct(body: CreateProductBody, userId: string) {
  // Unique SKU check
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, body.sku))
    .limit(1);

  if (existing) throw new AppError(`SKU "${body.sku}" already exists.`, 409, ERROR_CODES.CONFLICT);

  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        name:            body.name,
        sku:             body.sku,
        categoryId:      body.categoryId,
        unitOfMeasure:   body.unitOfMeasure,
        costPerUnit:     body.costPerUnit ? String(body.costPerUnit) : undefined,
        reorderPoint:    body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        createdBy:       userId,
        updatedBy:       userId,
      })
      .returning();

    let onHand = 0;

    if (body.initialStock && body.initialStock > 0 && body.initialLocationId) {
      // Verify location exists and get warehouseId for reference generation
      const [location] = await tx
        .select({ id: locations.id, warehouseId: locations.warehouseId })
        .from(locations)
        .where(and(eq(locations.id, body.initialLocationId), eq(locations.isActive, true)))
        .limit(1);

      if (!location) throw new AppError("Initial location not found.", 404, ERROR_CODES.NOT_FOUND);

      await tx.insert(stockLevels).values({
        productId:  product!.id,
        locationId: body.initialLocationId,
        onHand:     body.initialStock,
        reserved:   0,
      });

      const reference = await generateReference(location.warehouseId, "ADJ", tx);

      await tx.insert(inventoryLedger).values({
        reference,
        movementType:       "IN",
        productId:          product!.id,
        toLocationId:       body.initialLocationId,
        quantity:           body.initialStock,
        sourceDocumentType: "adjustment",
        performedBy:        userId,
        performedAt:        new Date(),
      });

      onHand = body.initialStock;
    }

    return { id: product!.id, name: product!.name, sku: product!.sku, unitOfMeasure: product!.unitOfMeasure, onHand };
  });
}

// ---------------------------------------------------------------------------
// Update product (metadata only — SKU cannot change)
// ---------------------------------------------------------------------------
export async function updateProduct(productId: string, body: UpdateProductBody, userId: string) {
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!existing) throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);

  const [updated] = await db
    .update(products)
    .set({
      ...(body.name            !== undefined && { name:            body.name }),
      ...(body.categoryId      !== undefined && { categoryId:      body.categoryId }),
      ...(body.unitOfMeasure   !== undefined && { unitOfMeasure:   body.unitOfMeasure }),
      ...(body.costPerUnit     !== undefined && { costPerUnit:     String(body.costPerUnit) }),
      ...(body.reorderPoint    !== undefined && { reorderPoint:    body.reorderPoint }),
      ...(body.reorderQuantity !== undefined && { reorderQuantity: body.reorderQuantity }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(products.id, productId))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Delete product — soft deactivate, blocked if movements exist
// ---------------------------------------------------------------------------
export async function deleteProduct(productId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!existing) throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);

  const [ledgerCheck] = await db
    .select({ c: count(inventoryLedger.id) })
    .from(inventoryLedger)
    .where(eq(inventoryLedger.productId, productId));

  if (ledgerCheck && Number(ledgerCheck.c) > 0) {
    throw new AppError(
      "Cannot deactivate product with historical inventory movements.",
      409, ERROR_CODES.OPERATION_BLOCKED
    );
  }

  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date(), updatedBy: userId })
    .where(eq(products.id, productId));
}
