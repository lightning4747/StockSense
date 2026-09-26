import { eq, ilike, count, and } from "drizzle-orm";
import { db } from "../../db";
import { warehouses, locations, stockLevels, inventoryLedger } from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import type { CreateWarehouseBody, UpdateWarehouseBody } from "./warehouses.schemas";

// ---------------------------------------------------------------------------
// List warehouses (with locationCount)
// ---------------------------------------------------------------------------
export async function listWarehouses(search?: string) {
  const rows = await db
    .select({
      id: warehouses.id,
      name: warehouses.name,
      shortCode: warehouses.shortCode,
      address: warehouses.address,
      isActive: warehouses.isActive,
    })
    .from(warehouses)
    .where(
      and(
        eq(warehouses.isActive, true),
        search ? ilike(warehouses.name, `%${search}%`) : undefined
      )
    );

  // Fetch location counts in one query
  const counts = await db
    .select({
      warehouseId: locations.warehouseId,
      locationCount: count(locations.id),
    })
    .from(locations)
    .where(eq(locations.isActive, true))
    .groupBy(locations.warehouseId);

  const countMap = new Map(counts.map((c) => [c.warehouseId, Number(c.locationCount)]));

  return rows.map((w) => ({
    ...w,
    locationCount: countMap.get(w.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Get single warehouse
// ---------------------------------------------------------------------------
export async function getWarehouse(warehouseId: string) {
  const [warehouse] = await db
    .select()
    .from(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.isActive, true)))
    .limit(1);

  if (!warehouse) {
    throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);
  }

  return warehouse;
}

// ---------------------------------------------------------------------------
// Create warehouse
// ---------------------------------------------------------------------------
export async function createWarehouse(body: CreateWarehouseBody, userId: string) {
  // Unique shortCode check
  const [existing] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(eq(warehouses.shortCode, body.shortCode))
    .limit(1);

  if (existing) {
    throw new AppError(
      `Warehouse short code "${body.shortCode}" is already in use.`,
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const [created] = await db
    .insert(warehouses)
    .values({
      name: body.name,
      shortCode: body.shortCode,
      address: body.address,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Update warehouse
// ---------------------------------------------------------------------------
export async function updateWarehouse(
  warehouseId: string,
  body: UpdateWarehouseBody,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);
  }

  // If shortCode is changing, check uniqueness
  if (body.shortCode && body.shortCode !== existing.shortCode) {
    const [conflict] = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.shortCode, body.shortCode))
      .limit(1);

    if (conflict) {
      throw new AppError(
        `Warehouse short code "${body.shortCode}" is already in use.`,
        409,
        ERROR_CODES.CONFLICT
      );
    }
    // Note: historical references stored at creation time are immutable;
    // changing shortCode here only affects future reference generation.
  }

  const [updated] = await db
    .update(warehouses)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.shortCode !== undefined && { shortCode: body.shortCode }),
      ...(body.address !== undefined && { address: body.address }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(warehouses.id, warehouseId))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Delete warehouse (soft-delete, blocked if stock or ops exist)
// ---------------------------------------------------------------------------
export async function deleteWarehouse(warehouseId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);
  }

  // Block if any location in this warehouse still has stock
  const [stockCheck] = await db
    .select({ c: count(stockLevels.id) })
    .from(stockLevels)
    .innerJoin(locations, eq(stockLevels.locationId, locations.id))
    .where(eq(locations.warehouseId, warehouseId));

  if (stockCheck && Number(stockCheck.c) > 0) {
    throw new AppError(
      "Cannot delete warehouse with existing stock levels.",
      409,
      ERROR_CODES.OPERATION_BLOCKED
    );
  }

  // Block if any ledger entries reference locations in this warehouse
  const [ledgerCheck] = await db
    .select({ c: count(inventoryLedger.id) })
    .from(inventoryLedger)
    .innerJoin(locations, eq(inventoryLedger.toLocationId, locations.id))
    .where(eq(locations.warehouseId, warehouseId));

  if (ledgerCheck && Number(ledgerCheck.c) > 0) {
    throw new AppError(
      "Cannot delete warehouse with historical inventory operations.",
      409,
      ERROR_CODES.OPERATION_BLOCKED
    );
  }

  await db
    .update(warehouses)
    .set({ isActive: false, updatedAt: new Date(), updatedBy: userId })
    .where(eq(warehouses.id, warehouseId));
}
