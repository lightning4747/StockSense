import { eq, and, count, sql, lt, lte, gte } from "drizzle-orm";
import { db } from "../../db";
import {
  products, stockLevels, locations,
  receipts, deliveryOrders, transfers,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// GET /dashboard — KPI aggregation
// ---------------------------------------------------------------------------
export async function getDashboardKpis(q: {
  warehouseId?: string; locationId?: string; categoryId?: string;
}) {
  const stockWheres = [
    eq(products.isActive, true),
    eq(locations.isActive, true),
    q.warehouseId ? eq(locations.warehouseId, q.warehouseId) : undefined,
    q.locationId  ? eq(stockLevels.locationId, q.locationId) : undefined,
    q.categoryId  ? eq(products.categoryId, q.categoryId)    : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  // Total products with stock
  const [totalRow] = await db
    .select({ c: count(stockLevels.id) })
    .from(stockLevels)
    .innerJoin(products,  eq(stockLevels.productId, products.id))
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(and(...stockWheres));

  // Low stock (0 < onHand <= reorderPoint)
  const [lowRow] = await db
    .select({ c: count(stockLevels.id) })
    .from(stockLevels)
    .innerJoin(products,  eq(stockLevels.productId, products.id))
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(and(
      ...stockWheres,
      sql`${stockLevels.onHand} > 0`,
      lte(stockLevels.onHand, products.reorderPoint)
    ));

  // Out of stock
  const [outRow] = await db
    .select({ c: count(stockLevels.id) })
    .from(stockLevels)
    .innerJoin(products,  eq(stockLevels.productId, products.id))
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(and(...stockWheres, eq(stockLevels.onHand, 0)));

  // Pending receipts (DRAFT or READY)
  const [pendingReceiptsRow] = await db
    .select({ c: count(receipts.id) })
    .from(receipts)
    .where(sql`${receipts.status} IN ('DRAFT','READY')`);

  // Pending deliveries
  const [pendingDeliveriesRow] = await db
    .select({ c: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(sql`${deliveryOrders.status} IN ('DRAFT','WAITING','READY')`);

  // Scheduled transfers (DRAFT or READY)
  const [scheduledTransfersRow] = await db
    .select({ c: count(transfers.id) })
    .from(transfers)
    .where(sql`${transfers.status} IN ('DRAFT','READY')`);

  return {
    totalProductsInStock: Number(totalRow?.c ?? 0),
    lowStockItems:        Number(lowRow?.c  ?? 0),
    outOfStockItems:      Number(outRow?.c  ?? 0),
    pendingReceipts:      Number(pendingReceiptsRow?.c   ?? 0),
    pendingDeliveries:    Number(pendingDeliveriesRow?.c ?? 0),
    scheduledTransfers:   Number(scheduledTransfersRow?.c ?? 0),
  };
}

// ---------------------------------------------------------------------------
// GET /dashboard/operations — receipts + deliveries stats
// ---------------------------------------------------------------------------
export async function getDashboardOperations(q: {
  warehouseId?: string; dateFrom?: string; dateTo?: string;
}) {
  const now = new Date();

  const receiptWheres = [
    q.warehouseId ? eq(receipts.warehouseId, q.warehouseId) : undefined,
    q.dateFrom    ? gte(receipts.scheduledAt, new Date(q.dateFrom)) : undefined,
    q.dateTo      ? lte(receipts.scheduledAt, new Date(q.dateTo))   : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const deliveryWheres = [
    q.warehouseId ? eq(deliveryOrders.warehouseId, q.warehouseId) : undefined,
    q.dateFrom    ? gte(deliveryOrders.scheduledAt, new Date(q.dateFrom)) : undefined,
    q.dateTo      ? lte(deliveryOrders.scheduledAt, new Date(q.dateTo))   : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  // Receipts: toReceive (READY), late (READY + overdue), total operations
  const [toReceiveRow] = await db
    .select({ c: count(receipts.id) })
    .from(receipts)
    .where(and(...receiptWheres, eq(receipts.status, "READY")));

  const [lateReceiptsRow] = await db
    .select({ c: count(receipts.id) })
    .from(receipts)
    .where(and(
      ...receiptWheres,
      eq(receipts.status, "READY"),
      lt(receipts.scheduledAt, now)
    ));

  const [totalReceiptsRow] = await db
    .select({ c: count(receipts.id) })
    .from(receipts)
    .where(receiptWheres.length ? and(...receiptWheres) : undefined);

  // Deliveries: toDeliver (READY), late (READY + overdue), waiting, total operations
  const [toDeliverRow] = await db
    .select({ c: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(and(...deliveryWheres, eq(deliveryOrders.status, "READY")));

  const [lateDeliveriesRow] = await db
    .select({ c: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(and(
      ...deliveryWheres,
      eq(deliveryOrders.status, "READY"),
      lt(deliveryOrders.scheduledAt, now)
    ));

  const [waitingRow] = await db
    .select({ c: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(and(...deliveryWheres, eq(deliveryOrders.status, "WAITING")));

  const [totalDeliveriesRow] = await db
    .select({ c: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(deliveryWheres.length ? and(...deliveryWheres) : undefined);

  return {
    receipts: {
      toReceive:  Number(toReceiveRow?.c    ?? 0),
      late:       Number(lateReceiptsRow?.c ?? 0),
      operations: Number(totalReceiptsRow?.c ?? 0),
    },
    deliveries: {
      toDeliver:  Number(toDeliverRow?.c      ?? 0),
      late:       Number(lateDeliveriesRow?.c ?? 0),
      waiting:    Number(waitingRow?.c        ?? 0),
      operations: Number(totalDeliveriesRow?.c ?? 0),
    },
  };
}
