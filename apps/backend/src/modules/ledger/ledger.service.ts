import { eq, and, ilike, gte, lte, count } from "drizzle-orm";
import { db } from "../../db";
import { inventoryLedger, products, locations } from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";

// ---------------------------------------------------------------------------
// GET /inventory/moves — paginated, filterable
// ---------------------------------------------------------------------------
export async function listMoves(q: {
  page: number; limit: number; search?: string; reference?: string;
  productId?: string; warehouseId?: string; locationId?: string;
  movementType?: string; dateFrom?: string; dateTo?: string;
}) {
  const wheres = [
    q.reference    ? ilike(inventoryLedger.reference, `%${q.reference}%`)   : undefined,
    q.productId    ? eq(inventoryLedger.productId, q.productId)              : undefined,
    q.locationId   ? eq(inventoryLedger.toLocationId, q.locationId)         : undefined,
    q.movementType ? eq(inventoryLedger.movementType, q.movementType)       : undefined,
    q.dateFrom     ? gte(inventoryLedger.performedAt, new Date(q.dateFrom)) : undefined,
    q.dateTo       ? lte(inventoryLedger.performedAt, new Date(q.dateTo))   : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const where = wheres.length ? and(...wheres) : undefined;

  const [{ total }] = await db
    .select({ total: count(inventoryLedger.id) })
    .from(inventoryLedger)
    .where(where);

  const rows = await db
    .select({
      id:           inventoryLedger.id,
      reference:    inventoryLedger.reference,
      movementType: inventoryLedger.movementType,
      productId:    inventoryLedger.productId,
      productSku:   products.sku,
      productName:  products.name,
      fromLocationId: inventoryLedger.fromLocationId,
      toLocationId:   inventoryLedger.toLocationId,
      quantity:     inventoryLedger.quantity,
      contact:      inventoryLedger.contact,
      performedAt:  inventoryLedger.performedAt,
      createdAt:    inventoryLedger.createdAt,
    })
    .from(inventoryLedger)
    .innerJoin(products, eq(inventoryLedger.productId, products.id))
    .where(where)
    .orderBy(inventoryLedger.performedAt)
    .limit(q.limit)
    .offset(getOffset(q.page, q.limit));

  return {
    data: rows.map((r) => ({
      id:           r.id,
      reference:    r.reference,
      movementType: r.movementType,
      product: { id: r.productId, sku: r.productSku, name: r.productName },
      fromLocationId: r.fromLocationId,
      toLocationId:   r.toLocationId,
      quantity:     r.quantity,
      contact:      r.contact,
      performedAt:  r.performedAt,
      createdAt:    r.createdAt,
    })),
    pagination: buildPaginationMeta(q.page, q.limit, Number(total)),
  };
}

// ---------------------------------------------------------------------------
// GET /inventory/moves/:moveId
// ---------------------------------------------------------------------------
export async function getMove(moveId: string) {
  const [move] = await db
    .select({
      id:                 inventoryLedger.id,
      reference:          inventoryLedger.reference,
      movementType:       inventoryLedger.movementType,
      productId:          inventoryLedger.productId,
      productSku:         products.sku,
      productName:        products.name,
      fromLocationId:     inventoryLedger.fromLocationId,
      toLocationId:       inventoryLedger.toLocationId,
      quantity:           inventoryLedger.quantity,
      sourceDocumentId:   inventoryLedger.sourceDocumentId,
      sourceDocumentType: inventoryLedger.sourceDocumentType,
      contact:            inventoryLedger.contact,
      performedBy:        inventoryLedger.performedBy,
      performedAt:        inventoryLedger.performedAt,
      createdAt:          inventoryLedger.createdAt,
    })
    .from(inventoryLedger)
    .innerJoin(products, eq(inventoryLedger.productId, products.id))
    .where(eq(inventoryLedger.id, moveId))
    .limit(1);

  if (!move) throw new AppError("Ledger entry not found.", 404, ERROR_CODES.NOT_FOUND);

  return {
    ...move,
    product: { id: move.productId, sku: move.productSku, name: move.productName },
  };
}
