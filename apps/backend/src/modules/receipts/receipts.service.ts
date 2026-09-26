import { eq, and, ilike, gte, lte, count } from "drizzle-orm";
import { db } from "../../db";
import {
  receipts, receiptItems, stockLevels,
  products, locations, warehouses, inventoryLedger,
} from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import { generateReference } from "../../utils/referenceGenerator";
import type { CreateReceiptBody, UpdateReceiptBody } from "./receipts.schemas";

const TERMINAL = ["DONE", "CANCELED"] as const;

// ---------------------------------------------------------------------------
// List receipts
// ---------------------------------------------------------------------------
export async function listReceipts(q: {
  page: number; limit: number; search?: string; status?: string;
  warehouseId?: string; locationId?: string; dateFrom?: string; dateTo?: string;
}) {
  const wheres = [
    q.search      ? ilike(receipts.reference, `%${q.search}%`)                  : undefined,
    q.status      ? eq(receipts.status, q.status)                                : undefined,
    q.warehouseId ? eq(receipts.warehouseId, q.warehouseId)                      : undefined,
    q.locationId  ? eq(receipts.destinationLocationId, q.locationId)             : undefined,
    q.dateFrom    ? gte(receipts.scheduledAt, new Date(q.dateFrom))              : undefined,
    q.dateTo      ? lte(receipts.scheduledAt, new Date(q.dateTo))                : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const where = wheres.length ? and(...wheres) : undefined;

  const [{ total }] = await db.select({ total: count(receipts.id) }).from(receipts).where(where);

  const rows = await db
    .select()
    .from(receipts)
    .where(where)
    .limit(q.limit)
    .offset(getOffset(q.page, q.limit));

  return { data: rows, pagination: buildPaginationMeta(q.page, q.limit, Number(total)) };
}

// ---------------------------------------------------------------------------
// Get receipt with line items
// ---------------------------------------------------------------------------
export async function getReceipt(receiptId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (!receipt) throw new AppError("Receipt not found.", 404, ERROR_CODES.RECEIPT_NOT_FOUND);

  const items = await db
    .select({
      id:          receiptItems.id,
      productId:   receiptItems.productId,
      sku:         products.sku,
      productName: products.name,
      quantity:    receiptItems.quantity,
      receivedQuantity: receiptItems.receivedQuantity,
    })
    .from(receiptItems)
    .innerJoin(products, eq(receiptItems.productId, products.id))
    .where(eq(receiptItems.receiptId, receiptId));

  return { ...receipt, items };
}

// ---------------------------------------------------------------------------
// Create receipt (DRAFT)
// ---------------------------------------------------------------------------
export async function createReceipt(body: CreateReceiptBody, userId: string) {
  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, body.warehouseId), eq(warehouses.isActive, true)))
    .limit(1);
  if (!warehouse) throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);

  const reference = await generateReference(body.warehouseId, "IN");

  const [receipt] = await db
    .insert(receipts)
    .values({
      reference,
      warehouseId:           body.warehouseId,
      destinationLocationId: body.destinationLocationId,
      supplierName:          body.supplierName,
      scheduledAt:           body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status:                "DRAFT",
      responsibleUserId:     userId,
      createdBy:             userId,
      updatedBy:             userId,
    })
    .returning();

  await db.insert(receiptItems).values(
    body.items.map((item) => ({
      receiptId: receipt!.id,
      productId: item.productId,
      quantity:  item.quantity,
    }))
  );

  return {
    id:        receipt!.id,
    reference: receipt!.reference,
    status:    receipt!.status,
    items:     body.items,
  };
}

// ---------------------------------------------------------------------------
// Update receipt (blocked if DONE/CANCELED)
// ---------------------------------------------------------------------------
export async function updateReceipt(receiptId: string, body: UpdateReceiptBody, userId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (!receipt) throw new AppError("Receipt not found.", 404, ERROR_CODES.RECEIPT_NOT_FOUND);
  if (TERMINAL.includes(receipt.status as typeof TERMINAL[number])) {
    throw new AppError(
      `Cannot modify a receipt in ${receipt.status} status.`,
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  await db
    .update(receipts)
    .set({
      ...(body.destinationLocationId && { destinationLocationId: body.destinationLocationId }),
      ...(body.supplierName !== undefined && { supplierName: body.supplierName }),
      ...(body.scheduledAt  && { scheduledAt: new Date(body.scheduledAt) }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(receipts.id, receiptId));

  if (body.items) {
    await db.delete(receiptItems).where(eq(receiptItems.receiptId, receiptId));
    await db.insert(receiptItems).values(
      body.items.map((item) => ({ receiptId, productId: item.productId, quantity: item.quantity }))
    );
  }

  return getReceipt(receiptId);
}

// ---------------------------------------------------------------------------
// Ready: DRAFT → READY
// ---------------------------------------------------------------------------
export async function readyReceipt(receiptId: string, userId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (!receipt) throw new AppError("Receipt not found.", 404, ERROR_CODES.RECEIPT_NOT_FOUND);
  if (receipt.status !== "DRAFT") {
    throw new AppError("Only DRAFT receipts can be moved to READY.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  await db
    .update(receipts)
    .set({ status: "READY", updatedAt: new Date(), updatedBy: userId })
    .where(eq(receipts.id, receiptId));

  return { id: receiptId, status: "READY" };
}

// ---------------------------------------------------------------------------
// Validate: READY → DONE  (atomic transaction)
// ---------------------------------------------------------------------------
export async function validateReceipt(receiptId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [receipt] = await tx
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) throw new AppError("Receipt not found.", 404, ERROR_CODES.RECEIPT_NOT_FOUND);
    if (receipt.status !== "READY") {
      throw new AppError("Only READY receipts can be validated.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
    }

    const items = await tx
      .select()
      .from(receiptItems)
      .where(eq(receiptItems.receiptId, receiptId));

    for (const item of items) {
      // Upsert stock level (INSERT … ON CONFLICT UPDATE)
      const [existing] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, receipt.destinationLocationId)
          )
        )
        .limit(1);

      if (existing) {
        await tx
          .update(stockLevels)
          .set({ onHand: existing.onHand + item.quantity, updatedAt: new Date() })
          .where(eq(stockLevels.id, existing.id));
      } else {
        await tx.insert(stockLevels).values({
          productId:  item.productId,
          locationId: receipt.destinationLocationId,
          onHand:     item.quantity,
          reserved:   0,
        });
      }

      await tx.insert(inventoryLedger).values({
        reference:          receipt.reference,
        movementType:       "IN",
        productId:          item.productId,
        toLocationId:       receipt.destinationLocationId,
        quantity:           item.quantity,
        sourceDocumentId:   receipt.id,
        sourceDocumentType: "receipt",
        contact:            receipt.supplierName ?? undefined,
        performedBy:        userId,
        performedAt:        new Date(),
      });
    }

    const now = new Date();
    await tx
      .update(receipts)
      .set({ status: "DONE", validatedAt: now, updatedAt: now, updatedBy: userId })
      .where(eq(receipts.id, receiptId));

    return { id: receiptId, reference: receipt.reference, status: "DONE" };
  });
}

// ---------------------------------------------------------------------------
// Cancel: DRAFT|READY → CANCELED
// ---------------------------------------------------------------------------
export async function cancelReceipt(receiptId: string, userId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (!receipt) throw new AppError("Receipt not found.", 404, ERROR_CODES.RECEIPT_NOT_FOUND);
  if (receipt.status === "DONE") {
    throw new AppError("A completed receipt cannot be canceled.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
  }
  if (receipt.status === "CANCELED") {
    throw new AppError("Receipt is already canceled.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  await db
    .update(receipts)
    .set({ status: "CANCELED", updatedAt: new Date(), updatedBy: userId })
    .where(eq(receipts.id, receiptId));

  return { id: receiptId, status: "CANCELED" };
}
