import { eq, ilike, count, and } from "drizzle-orm";
import { db } from "../../db";
import { locations, warehouses, stockLevels, inventoryLedger } from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import type { CreateLocationBody, UpdateLocationBody } from "./locations.schemas";

// ---------------------------------------------------------------------------
// List locations (optionally filtered by warehouseId)
// ---------------------------------------------------------------------------
export async function listLocations(warehouseId?: string, search?: string) {
  const conditions = [
    eq(locations.isActive, true),
    warehouseId ? eq(locations.warehouseId, warehouseId) : undefined,
    search ? ilike(locations.name, `%${search}%`) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select({
      id: locations.id,
      name: locations.name,
      shortCode: locations.shortCode,
      warehouseId: locations.warehouseId,
      isActive: locations.isActive,
    })
    .from(locations)
    .where(and(...conditions));

  return rows;
}

// ---------------------------------------------------------------------------
// Get single location
// ---------------------------------------------------------------------------
export async function getLocation(locationId: string) {
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.isActive, true)))
    .limit(1);

  if (!location) {
    throw new AppError("Location not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return location;
}

// ---------------------------------------------------------------------------
// Create location
// ---------------------------------------------------------------------------
export async function createLocation(body: CreateLocationBody, userId: string) {
  // Verify warehouse exists
  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, body.warehouseId), eq(warehouses.isActive, true)))
    .limit(1);

  if (!warehouse) {
    throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);
  }

  // shortCode must be unique within the warehouse
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.warehouseId, body.warehouseId),
        eq(locations.shortCode, body.shortCode)
      )
    )
    .limit(1);

  if (existing) {
    throw new AppError(
      `Short code "${body.shortCode}" already exists in this warehouse.`,
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const [created] = await db
    .insert(locations)
    .values({
      warehouseId: body.warehouseId,
      name: body.name,
      shortCode: body.shortCode,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Update location
// ---------------------------------------------------------------------------
export async function updateLocation(
  locationId: string,
  body: UpdateLocationBody,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Location not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  // If shortCode is changing, check uniqueness within same warehouse
  if (body.shortCode && body.shortCode !== existing.shortCode) {
    const [conflict] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(
        and(
          eq(locations.warehouseId, existing.warehouseId),
          eq(locations.shortCode, body.shortCode)
        )
      )
      .limit(1);

    if (conflict) {
      throw new AppError(
        `Short code "${body.shortCode}" already exists in this warehouse.`,
        409,
        ERROR_CODES.CONFLICT
      );
    }
  }

  const [updated] = await db
    .update(locations)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.shortCode !== undefined && { shortCode: body.shortCode }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(locations.id, locationId))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Delete location (soft-delete, blocked if stock or ops exist)
// ---------------------------------------------------------------------------
export async function deleteLocation(locationId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.isActive, true)))
    .limit(1);

  if (!existing) {
    throw new AppError("Location not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  // Block if any stock currently sits at this location
  const [stockCheck] = await db
    .select({ c: count(stockLevels.id) })
    .from(stockLevels)
    .where(eq(stockLevels.locationId, locationId));

  if (stockCheck && Number(stockCheck.c) > 0) {
    throw new AppError(
      "Cannot delete location with existing stock levels.",
      409,
      ERROR_CODES.OPERATION_BLOCKED
    );
  }

  // Block if any ledger entry references this location
  const [ledgerTo] = await db
    .select({ c: count(inventoryLedger.id) })
    .from(inventoryLedger)
    .where(eq(inventoryLedger.toLocationId, locationId));

  const [ledgerFrom] = await db
    .select({ c: count(inventoryLedger.id) })
    .from(inventoryLedger)
    .where(eq(inventoryLedger.fromLocationId, locationId));

  if (
    (ledgerTo && Number(ledgerTo.c) > 0) ||
    (ledgerFrom && Number(ledgerFrom.c) > 0)
  ) {
    throw new AppError(
      "Cannot delete location with historical inventory movements.",
      409,
      ERROR_CODES.OPERATION_BLOCKED
    );
  }

  await db
    .update(locations)
    .set({ isActive: false, updatedAt: new Date(), updatedBy: userId })
    .where(eq(locations.id, locationId));
}
