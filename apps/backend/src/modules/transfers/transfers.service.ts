import { eq, and, ilike, gte, lte, count } from "drizzle-orm";
import { db } from "../../db";
import {
  transfers, transferItems, stockLevels,
  products, locations, warehouses, inventoryLedger,
} from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { getOffset, buildPaginationMeta } from "../../utils/pagination";
import { generateReference } from "../../utils/referenceGenerator";
import type { CreateTransferBody, UpdateTransferBody } from "./transfers.schemas";

const TERMINAL = ["DONE", "CANCELED"] as const;

// ---------------------------------------------------------------------------
// List transfers
// ---------------------------------------------------------------------------
export async function listTransfers(q: {
  page: number; limit: number; search?: string; status?: string;
  warehouseId?: string; sourceLocationId?: string;
  destinationLocationId?: string; dateFrom?: string; dateTo?: string;
}) {
  const wheres = [
    q.search               ? ilike(transfers.reference, `%${q.search}%`)               : undefined,
    q.status               ? eq(transfers.status, q.status)                             : undefined,
    q.warehouseId          ? eq(transfers.warehouseId, q.warehouseId)                   : undefined,
    q.sourceLocationId     ? eq(transfers.sourceLocationId, q.sourceLocationId)         : undefined,
    q.destinationLocationId? eq(transfers.destinationLocationId, q.destinationLocationId): undefined,
    q.dateFrom             ? gte(transfers.scheduledAt, new Date(q.dateFrom))            : undefined,
    q.dateTo               ? lte(transfers.scheduledAt, new Date(q.dateTo))              : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const where = wheres.length ? and(...wheres) : undefined;

  const [{ total }] = await db
    .select({ total: count(transfers.id) })
    .from(transfers)
    .where(where);

  const rows = await db
    .select()
    .from(transfers)
    .where(where)
    .limit(q.limit)
    .offset(getOffset(q.page, q.limit));

  return { data: rows, pagination: buildPaginationMeta(q.page, q.limit, Number(total)) };
}

// ---------------------------------------------------------------------------
// Get transfer with line items
// ---------------------------------------------------------------------------
export async function getTransfer(transferId: string) {
  const [transfer] = await db
    .select()
    .from(transfers)
    .where(eq(transfers.id, transferId))
    .limit(1);

  if (!transfer) throw new AppError("Transfer not found.", 404, ERROR_CODES.TRANSFER_NOT_FOUND);

  const items = await db
    .select({
      id:          transferItems.id,
      productId:   transferItems.productId,
      sku:         products.sku,
      productName: products.name,
      quantity:    transferItems.quantity,
    })
    .from(transferItems)
    .innerJoin(products, eq(transferItems.productId, products.id))
    .where(eq(transferItems.transferId, transferId));

  return { ...transfer, items };
}

// ---------------------------------------------------------------------------
// Create transfer (DRAFT)
// ---------------------------------------------------------------------------
export async function createTransfer(body: CreateTransferBody, userId: string) {
  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, body.warehouseId), eq(warehouses.isActive, true)))
    .limit(1);
  if (!warehouse) throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);

  const reference = await generateReference(body.warehouseId, "INT");

  const [transfer] = await db
    .insert(transfers)
    .values({
      reference,
      warehouseId:           body.warehouseId,
      sourceLocationId:      body.sourceLocationId,
      destinationLocationId: body.destinationLocationId,
      scheduledAt:           body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status:                "DRAFT",
      responsibleUserId:     userId,
      createdBy:             userId,
      updatedBy:             userId,
    })
    .returning();

  await db.insert(transferItems).values(
    body.items.map((item) => ({
      transferId: transfer!.id,
      productId:  item.productId,
      quantity:   item.quantity,
    }))
  );

  return { id: transfer!.id, reference: transfer!.reference, status: transfer!.status };
}

// ---------------------------------------------------------------------------
// Update transfer (blocked if DONE/CANCELED)
// ---------------------------------------------------------------------------
export async function updateTransfer(transferId: string, body: UpdateTransferBody, userId: string) {
  const [transfer] = await db
    .select()
    .from(transfers)
    .where(eq(transfers.id, transferId))
    .limit(1);

  if (!transfer) throw new AppError("Transfer not found.", 404, ERROR_CODES.TRANSFER_NOT_FOUND);
  if (TERMINAL.includes(transfer.status as typeof TERMINAL[number])) {
    throw new AppError(
      `Cannot modify a transfer in ${transfer.status} status.`,
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  await db
    .update(transfers)
    .set({
      ...(body.sourceLocationId      && { sourceLocationId:      body.sourceLocationId }),
      ...(body.destinationLocationId && { destinationLocationId: body.destinationLocationId }),
      ...(body.scheduledAt           && { scheduledAt:           new Date(body.scheduledAt) }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(transfers.id, transferId));

  if (body.items) {
    await db.delete(transferItems).where(eq(transferItems.transferId, transferId));
    await db.insert(transferItems).values(
      body.items.map((item) => ({
        transferId,
        productId: item.productId,
        quantity:  item.quantity,
      }))
    );
  }

  return getTransfer(transferId);
}

// ---------------------------------------------------------------------------
// Ready: DRAFT → READY — verify sufficient freeToUse at source
// ---------------------------------------------------------------------------
export async function readyTransfer(transferId: string, userId: string) {
  const [transfer] = await db
    .select()
    .from(transfers)
    .where(eq(transfers.id, transferId))
    .limit(1);

  if (!transfer) throw new AppError("Transfer not found.", 404, ERROR_CODES.TRANSFER_NOT_FOUND);
  if (transfer.status !== "DRAFT") {
    throw new AppError(
      "Only DRAFT transfers can be moved to READY.",
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const items = await db
    .select({
      productId: transferItems.productId,
      quantity:  transferItems.quantity,
      onHand:    stockLevels.onHand,
      reserved:  stockLevels.reserved,
    })
    .from(transferItems)
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, transferItems.productId),
        eq(stockLevels.locationId, transfer.sourceLocationId)
      )
    )
    .where(eq(transferItems.transferId, transferId));

  for (const item of items) {
    const freeToUse = (item.onHand ?? 0) - (item.reserved ?? 0);
    if (freeToUse < item.quantity) {
      throw new AppError(
        "Insufficient free stock at source location for one or more items.",
        409, ERROR_CODES.INSUFFICIENT_STOCK
      );
    }
  }

  await db
    .update(transfers)
    .set({ status: "READY", updatedAt: new Date(), updatedBy: userId })
    .where(eq(transfers.id, transferId));

  return { id: transferId, status: "READY" };
}

// ---------------------------------------------------------------------------
// Validate: READY → DONE (atomic — all items or none)
// ---------------------------------------------------------------------------
export async function validateTransfer(transferId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [transfer] = await tx
      .select()
      .from(transfers)
      .where(eq(transfers.id, transferId))
      .limit(1);

    if (!transfer) throw new AppError("Transfer not found.", 404, ERROR_CODES.TRANSFER_NOT_FOUND);
    if (transfer.status !== "READY") {
      throw new AppError(
        "Only READY transfers can be validated.",
        409, ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    const items = await tx
      .select()
      .from(transferItems)
      .where(eq(transferItems.transferId, transferId));

    // Validate ALL items first before mutating anything (all-or-nothing)
    const stockSnapshots: Array<{
      item: typeof items[number];
      sourceStock: typeof stockLevels.$inferSelect;
    }> = [];

    for (const item of items) {
      const [sourceStock] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, transfer.sourceLocationId)
          )
        )
        .limit(1);

      if (!sourceStock || sourceStock.onHand < item.quantity) {
        throw new AppError(
          "Insufficient stock at source location during validation.",
          409, ERROR_CODES.INSUFFICIENT_STOCK
        );
      }

      stockSnapshots.push({ item, sourceStock });
    }

    // All checks passed — apply mutations
    const now = new Date();

    for (const { item, sourceStock } of stockSnapshots) {
      // Deduct from source
      await tx
        .update(stockLevels)
        .set({ onHand: sourceStock.onHand - item.quantity, updatedAt: now })
        .where(eq(stockLevels.id, sourceStock.id));

      // Add to destination (upsert)
      const [destStock] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, transfer.destinationLocationId)
          )
        )
        .limit(1);

      if (destStock) {
        await tx
          .update(stockLevels)
          .set({ onHand: destStock.onHand + item.quantity, updatedAt: now })
          .where(eq(stockLevels.id, destStock.id));
      } else {
        await tx.insert(stockLevels).values({
          productId:  item.productId,
          locationId: transfer.destinationLocationId,
          onHand:     item.quantity,
          reserved:   0,
        });
      }

      // Two ledger entries per item: TRANSFER_OUT (source) + TRANSFER_IN (dest)
      await tx.insert(inventoryLedger).values([
        {
          reference:          transfer.reference,
          movementType:       "TRANSFER_OUT",
          productId:          item.productId,
          fromLocationId:     transfer.sourceLocationId,
          toLocationId:       null,
          quantity:           item.quantity,
          sourceDocumentId:   transfer.id,
          sourceDocumentType: "transfer",
          performedBy:        userId,
          performedAt:        now,
        },
        {
          reference:          transfer.reference,
          movementType:       "TRANSFER_IN",
          productId:          item.productId,
          fromLocationId:     null,
          toLocationId:       transfer.destinationLocationId,
          quantity:           item.quantity,
          sourceDocumentId:   transfer.id,
          sourceDocumentType: "transfer",
          performedBy:        userId,
          performedAt:        now,
        },
      ]);
    }

    await tx
      .update(transfers)
      .set({ status: "DONE", validatedAt: now, updatedAt: now, updatedBy: userId })
      .where(eq(transfers.id, transferId));

    return { id: transferId, reference: transfer.reference, status: "DONE" };
  });
}

// ---------------------------------------------------------------------------
// Cancel transfer
// ---------------------------------------------------------------------------
export async function cancelTransfer(transferId: string, userId: string) {
  const [transfer] = await db
    .select()
    .from(transfers)
    .where(eq(transfers.id, transferId))
    .limit(1);

  if (!transfer) throw new AppError("Transfer not found.", 404, ERROR_CODES.TRANSFER_NOT_FOUND);
  if (transfer.status === "DONE") {
    throw new AppError(
      "A completed transfer cannot be canceled.",
      409, ERROR_CODES.INVALID_STATUS_TRANSITION
    );
  }
  if (transfer.status === "CANCELED") {
    throw new AppError("Transfer is already canceled.", 409, ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  await db
    .update(transfers)
    .set({ status: "CANCELED", updatedAt: new Date(), updatedBy: userId })
    .where(eq(transfers.id, transferId));

  return { id: transferId, status: "CANCELED" };
}
