import { eq, and, ilike, gte, lte, count, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  deliveryOrders, deliveryItems, stockLevels,
  products, locations, warehouses, inventoryLedger,
} from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import { generateReference } from "../../utils/referenceGenerator";
import type { CreateDeliveryBody, UpdateDeliveryBody } from "./deliveries.schemas";

const TERMINAL = ["DONE", "CANCELED"] as const;

// ---------------------------------------------------------------------------
// List deliveries
// ---------------------------------------------------------------------------
export async function listDeliveries(q: {
  page: number; limit: number; search?: string; status?: string;
  warehouseId?: string; locationId?: string; dateFrom?: string; dateTo?: string;
}) {
  const wheres = [
    q.search      ? ilike(deliveryOrders.reference, `%${q.search}%`) : undefined,
    q.status      ? eq(deliveryOrders.status, q.status)               : undefined,
    q.warehouseId ? eq(deliveryOrders.warehouseId, q.warehouseId)     : undefined,
    q.locationId  ? eq(deliveryOrders.sourceLocationId, q.locationId) : undefined,
    q.dateFrom    ? gte(deliveryOrders.scheduledAt, new Date(q.dateFrom)) : undefined,
    q.dateTo      ? lte(deliveryOrders.scheduledAt, new Date(q.dateTo))   : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const where = wheres.length ? and(...wheres) : undefined;

  const [{ total }] = await db
    .select({ total: count(deliveryOrders.id) })
    .from(deliveryOrders)
    .where(where);

  const rows = await db
    .select()
    .from(deliveryOrders)
    .where(where)
    .limit(q.limit)
    .offset(getOffset(q.page, q.limit));

  return { data: rows, pagination: buildPaginationMeta(q.page, q.limit, Number(total)) };
}

// ---------------------------------------------------------------------------
// Get delivery with line items + availableQuantity per item
// ---------------------------------------------------------------------------
export async function getDelivery(deliveryId: string) {
  const [delivery] = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, deliveryId))
    .limit(1);

  if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);

  const items = await db
    .select({
      id:                deliveryItems.id,
      productId:         deliveryItems.productId,
      sku:               products.sku,
      productName:       products.name,
      requestedQuantity: deliveryItems.requestedQuantity,
      availableQuantity: sql<number>`coalesce(${stockLevels.onHand} - ${stockLevels.reserved}, 0)`,
    })
    .from(deliveryItems)
    .innerJoin(products, eq(deliveryItems.productId, products.id))
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, deliveryItems.productId),
        eq(stockLevels.locationId, delivery.sourceLocationId)
      )
    )
    .where(eq(deliveryItems.deliveryId, deliveryId));

  return { ...delivery, items };
}

// ---------------------------------------------------------------------------
// Create delivery (DRAFT)
// ---------------------------------------------------------------------------
export async function createDelivery(body: CreateDeliveryBody, userId: string) {
  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, body.warehouseId), eq(warehouses.isActive, true)))
    .limit(1);
  if (!warehouse) throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);

  const reference = await generateReference(body.warehouseId, "OUT");

  const [delivery] = await db
    .insert(deliveryOrders)
    .values({
      reference,
      warehouseId:      body.warehouseId,
      sourceLocationId: body.sourceLocationId,
      deliveryAddress:  body.deliveryAddress,
      scheduledAt:      body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status:           "DRAFT",
      responsibleUserId: userId,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  await db.insert(deliveryItems).values(
    body.items.map((item) => ({
      deliveryId:        delivery!.id,
      productId:         item.productId,
      requestedQuantity: item.quantity,
    }))
  );

  return { id: delivery!.id, reference: delivery!.reference, status: delivery!.status };
}

// ---------------------------------------------------------------------------
// Update delivery (blocked if DONE/CANCELED)
// ---------------------------------------------------------------------------
export async function updateDelivery(deliveryId: string, body: UpdateDeliveryBody, userId: string) {
  const [delivery] = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, deliveryId))
    .limit(1);

  if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);
  if (TERMINAL.includes(delivery.status as typeof TERMINAL[number])) {
    throw new AppError(
      `Cannot modify a delivery in ${delivery.status} status.`,
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  await db
    .update(deliveryOrders)
    .set({
      ...(body.sourceLocationId && { sourceLocationId: body.sourceLocationId }),
      ...(body.deliveryAddress  !== undefined && { deliveryAddress: body.deliveryAddress }),
      ...(body.scheduledAt      && { scheduledAt: new Date(body.scheduledAt) }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(deliveryOrders.id, deliveryId));

  if (body.items) {
    await db.delete(deliveryItems).where(eq(deliveryItems.deliveryId, deliveryId));
    await db.insert(deliveryItems).values(
      body.items.map((item) => ({
        deliveryId,
        productId:         item.productId,
        requestedQuantity: item.quantity,
      }))
    );
  }

  return getDelivery(deliveryId);
}

// ---------------------------------------------------------------------------
// Confirm: DRAFT → READY or DRAFT → WAITING
// ---------------------------------------------------------------------------
export async function confirmDelivery(deliveryId: string, userId: string) {
  const [delivery] = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, deliveryId))
    .limit(1);

  if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);
  if (delivery.status !== "DRAFT") {
    throw new AppError(
      "Only DRAFT deliveries can be confirmed.",
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const items = await db
    .select({
      productId:         deliveryItems.productId,
      requestedQuantity: deliveryItems.requestedQuantity,
      onHand:            stockLevels.onHand,
      reserved:          stockLevels.reserved,
    })
    .from(deliveryItems)
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, deliveryItems.productId),
        eq(stockLevels.locationId, delivery.sourceLocationId)
      )
    )
    .where(eq(deliveryItems.deliveryId, deliveryId));

  const allSufficient = items.every((item) => {
    const freeToUse = (item.onHand ?? 0) - (item.reserved ?? 0);
    return freeToUse >= item.requestedQuantity;
  });

  const newStatus = allSufficient ? "READY" : "WAITING";
  await db
    .update(deliveryOrders)
    .set({ status: newStatus, updatedAt: new Date(), updatedBy: userId })
    .where(eq(deliveryOrders.id, deliveryId));

  return { id: deliveryId, status: newStatus };
}

// ---------------------------------------------------------------------------
// Ready: WAITING → READY (recheck stock)
// ---------------------------------------------------------------------------
export async function readyDelivery(deliveryId: string, userId: string) {
  const [delivery] = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, deliveryId))
    .limit(1);

  if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);
  if (delivery.status !== "WAITING") {
    throw new AppError(
      "Only WAITING deliveries can be moved to READY.",
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const items = await db
    .select({
      productId:         deliveryItems.productId,
      requestedQuantity: deliveryItems.requestedQuantity,
      onHand:            stockLevels.onHand,
      reserved:          stockLevels.reserved,
    })
    .from(deliveryItems)
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, deliveryItems.productId),
        eq(stockLevels.locationId, delivery.sourceLocationId)
      )
    )
    .where(eq(deliveryItems.deliveryId, deliveryId));

  for (const item of items) {
    const freeToUse = (item.onHand ?? 0) - (item.reserved ?? 0);
    if (freeToUse < item.requestedQuantity) {
      throw new AppError(
        "Insufficient stock for one or more items.",
        409,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }
  }

  await db
    .update(deliveryOrders)
    .set({ status: "READY", updatedAt: new Date(), updatedBy: userId })
    .where(eq(deliveryOrders.id, deliveryId));

  return { id: deliveryId, status: "READY" };
}

// ---------------------------------------------------------------------------
// Validate: READY → DONE (atomic transaction)
// ---------------------------------------------------------------------------
export async function validateDelivery(deliveryId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [delivery] = await tx
      .select()
      .from(deliveryOrders)
      .where(eq(deliveryOrders.id, deliveryId))
      .limit(1);

    if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);
    if (delivery.status !== "READY") {
      throw new AppError(
        "Only READY deliveries can be validated.",
        409, ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    const items = await tx
      .select()
      .from(deliveryItems)
      .where(eq(deliveryItems.deliveryId, deliveryId));

    for (const item of items) {
      const [stock] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, delivery.sourceLocationId)
          )
        )
        .limit(1);

      const currentOnHand = stock?.onHand ?? 0;
      if (currentOnHand < item.requestedQuantity) {
        throw new AppError(
          "Insufficient stock during validation.",
          409,
          ERROR_CODES.INSUFFICIENT_STOCK
        );
      }

      const newOnHand = currentOnHand - item.requestedQuantity;

      if (!stock) {
        throw new AppError("Stock level record not found.", 409, ERROR_CODES.INSUFFICIENT_STOCK);
      }

      await tx
        .update(stockLevels)
        .set({ onHand: newOnHand, updatedAt: new Date() })
        .where(eq(stockLevels.id, stock.id));

      await tx.insert(inventoryLedger).values({
        reference:          delivery.reference,
        movementType:       "OUT",
        productId:          item.productId,
        fromLocationId:     delivery.sourceLocationId,
        toLocationId:       null,
        quantity:           item.requestedQuantity,
        sourceDocumentId:   delivery.id,
        sourceDocumentType: "delivery",
        performedBy:        userId,
        performedAt:        new Date(),
      });
    }

    const now = new Date();
    await tx
      .update(deliveryOrders)
      .set({ status: "DONE", validatedAt: now, updatedAt: now, updatedBy: userId })
      .where(eq(deliveryOrders.id, deliveryId));

    return { id: deliveryId, reference: delivery.reference, status: "DONE" };
  });
}

// ---------------------------------------------------------------------------
// Cancel: DRAFT|WAITING|READY → CANCELED
// ---------------------------------------------------------------------------
export async function cancelDelivery(deliveryId: string, userId: string) {
  const [delivery] = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, deliveryId))
    .limit(1);

  if (!delivery) throw new AppError("Delivery not found.", 404, ERROR_CODES.DELIVERY_NOT_FOUND);
  if (delivery.status === "DONE") {
    throw new AppError(
      "A completed delivery cannot be canceled.",
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }
  if (delivery.status === "CANCELED") {
    throw new AppError("Delivery is already canceled.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  await db
    .update(deliveryOrders)
    .set({ status: "CANCELED", updatedAt: new Date(), updatedBy: userId })
    .where(eq(deliveryOrders.id, deliveryId));

  return { id: deliveryId, status: "CANCELED" };
}
