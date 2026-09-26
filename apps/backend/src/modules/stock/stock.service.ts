import { eq, and, ilike, sql, count } from "drizzle-orm";
import { db } from "../../db";
import {
  stockLevels, products, locations, warehouses,
  categories, inventoryLedger,
} from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import { generateReference } from "../../utils/referenceGenerator";
import type { StockQuery, AdjustmentBody } from "./stock.schemas";

// ---------------------------------------------------------------------------
// GET /stock — paginated, filterable
// ---------------------------------------------------------------------------
export async function listStock(q: StockQuery) {
  const { page, limit, warehouseId, locationId, categoryId, productId, stockStatus } = q;

  const wheres = [
    eq(products.isActive, true),
    eq(locations.isActive, true),
    warehouseId ? eq(locations.warehouseId, warehouseId) : undefined,
    locationId  ? eq(stockLevels.locationId, locationId) : undefined,
    categoryId  ? eq(products.categoryId, categoryId)    : undefined,
    productId   ? eq(stockLevels.productId, productId)   : undefined,
    q.search    ? ilike(products.name, `%${q.search}%`)  : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  // stock status filter applied post-query via SQL expression
  const stockStatusExpr =
    stockStatus === "out"       ? sql`${stockLevels.onHand} = 0`
    : stockStatus === "low"     ? sql`${stockLevels.onHand} > 0 AND ${stockLevels.onHand} <= ${products.reorderPoint}`
    : stockStatus === "available" ? sql`${stockLevels.onHand} > ${products.reorderPoint}`
    : undefined;

  const allWheres = stockStatusExpr
    ? [...wheres, stockStatusExpr]
    : wheres;

  const baseQuery = db
    .select({
      productId:   stockLevels.productId,
      sku:         products.sku,
      product:     products.name,
      warehouseId: locations.warehouseId,
      locationId:  stockLevels.locationId,
      onHand:      stockLevels.onHand,
      reserved:    stockLevels.reserved,
      freeToUse:   sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}`,
      costPerUnit: products.costPerUnit,
    })
    .from(stockLevels)
    .innerJoin(products,   eq(stockLevels.productId, products.id))
    .innerJoin(locations,  eq(stockLevels.locationId, locations.id))
    .where(and(...allWheres));

  const [{ total }] = await db
    .select({ total: count(stockLevels.id) })
    .from(stockLevels)
    .innerJoin(products,  eq(stockLevels.productId, products.id))
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(and(...allWheres));

  const rows = await baseQuery.limit(limit).offset(getOffset(page, limit));

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(total)),
  };
}

// ---------------------------------------------------------------------------
// GET /stock/:productId — total + per-location breakdown
// ---------------------------------------------------------------------------
export async function getStockByProduct(productId: string) {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) {
    throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);
  }

  const locationRows = await db
    .select({
      warehouseId: locations.warehouseId,
      locationId:  stockLevels.locationId,
      onHand:      stockLevels.onHand,
      reserved:    stockLevels.reserved,
      freeToUse:   sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}`,
    })
    .from(stockLevels)
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(eq(stockLevels.productId, productId));

  const totalOnHand    = locationRows.reduce((s, r) => s + r.onHand, 0);
  const totalReserved  = locationRows.reduce((s, r) => s + r.reserved, 0);

  return {
    productId,
    totalOnHand,
    totalReserved,
    totalFreeToUse: totalOnHand - totalReserved,
    locations: locationRows,
  };
}

// ---------------------------------------------------------------------------
// POST /stock/adjustments — atomic tx, idempotency enforced at router level
// ---------------------------------------------------------------------------
export async function createAdjustment(body: AdjustmentBody, userId: string) {
  const { productId, locationId, countedQuantity, reason } = body;

  // Verify product + location exist
  const [product] = await db
    .select({ id: products.id, reorderPoint: products.reorderPoint })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);

  const [location] = await db
    .select({ id: locations.id, warehouseId: locations.warehouseId })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.isActive, true)))
    .limit(1);

  if (!location) throw new AppError("Location not found.", 404, ERROR_CODES.NOT_FOUND);

  const result = await db.transaction(async (tx) => {
    // Lock the stock row (SELECT current on_hand)
    const [currentStock] = await tx
      .select({ id: stockLevels.id, onHand: stockLevels.onHand })
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.productId, productId),
          eq(stockLevels.locationId, locationId)
        )
      )
      .limit(1);

    const currentOnHand = currentStock?.onHand ?? 0;
    const difference = countedQuantity - currentOnHand;

    // Insert or update stock level
    if (!currentStock) {
      await tx.insert(stockLevels).values({
        productId,
        locationId,
        onHand:   countedQuantity,
        reserved: 0,
      });
    } else {
      await tx
        .update(stockLevels)
        .set({ onHand: countedQuantity, updatedAt: new Date() })
        .where(eq(stockLevels.id, currentStock.id));
    }

    // Generate reference
    const reference = await generateReference(location.warehouseId, "ADJ", tx);

    // Append ledger entry (ADJUSTMENT)
    const [ledgerEntry] = await tx
      .insert(inventoryLedger)
      .values({
        reference,
        movementType: "ADJUSTMENT",
        productId,
        fromLocationId: difference < 0 ? locationId : null,
        toLocationId:   difference >= 0 ? locationId : null,
        quantity:       Math.abs(difference),
        sourceDocumentType: "adjustment",
        contact: reason,
        performedBy: userId,
        performedAt: new Date(),
      })
      .returning();

    return { adjustmentId: ledgerEntry!.id, previousQuantity: currentOnHand, countedQuantity, difference };
  });

  return result;
}
