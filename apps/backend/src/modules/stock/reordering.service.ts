import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { reorderingRules, products, warehouses, locations } from "../../db/schema";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import type {
  CreateReorderingRuleBody,
  UpdateReorderingRuleBody,
} from "./reordering.schemas";

// ---------------------------------------------------------------------------
// List reordering rules — filterable
// ---------------------------------------------------------------------------
export async function listReorderingRules(
  productId?: string,
  warehouseId?: string,
  locationId?: string
) {
  const conditions = [
    productId   ? eq(reorderingRules.productId,   productId)   : undefined,
    warehouseId ? eq(reorderingRules.warehouseId, warehouseId) : undefined,
    locationId  ? eq(reorderingRules.locationId,  locationId)  : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  return db
    .select()
    .from(reorderingRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
}

// ---------------------------------------------------------------------------
// Create reordering rule
// ---------------------------------------------------------------------------
export async function createReorderingRule(
  body: CreateReorderingRuleBody,
  userId: string
) {
  // Verify FK references exist
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, body.productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) throw new AppError("Product not found.", 404, ERROR_CODES.PRODUCT_NOT_FOUND);

  const [warehouse] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, body.warehouseId), eq(warehouses.isActive, true)))
    .limit(1);

  if (!warehouse) throw new AppError("Warehouse not found.", 404, ERROR_CODES.WAREHOUSE_NOT_FOUND);

  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.id, body.locationId), eq(locations.isActive, true)))
    .limit(1);

  if (!location) throw new AppError("Location not found.", 404, ERROR_CODES.NOT_FOUND);

  const [created] = await db
    .insert(reorderingRules)
    .values({
      productId:       body.productId,
      warehouseId:     body.warehouseId,
      locationId:      body.locationId,
      reorderPoint:    body.reorderPoint,
      reorderQuantity: body.reorderQuantity,
      enabled:         body.enabled ?? true,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Update reordering rule
// ---------------------------------------------------------------------------
export async function updateReorderingRule(
  ruleId: string,
  body: UpdateReorderingRuleBody,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(reorderingRules)
    .where(eq(reorderingRules.id, ruleId))
    .limit(1);

  if (!existing) throw new AppError("Reordering rule not found.", 404, ERROR_CODES.NOT_FOUND);

  const [updated] = await db
    .update(reorderingRules)
    .set({
      ...(body.reorderPoint    !== undefined && { reorderPoint:    body.reorderPoint }),
      ...(body.reorderQuantity !== undefined && { reorderQuantity: body.reorderQuantity }),
      ...(body.enabled         !== undefined && { enabled:         body.enabled }),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(reorderingRules.id, ruleId))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Delete reordering rule
// ---------------------------------------------------------------------------
export async function deleteReorderingRule(ruleId: string) {
  const [existing] = await db
    .select()
    .from(reorderingRules)
    .where(eq(reorderingRules.id, ruleId))
    .limit(1);

  if (!existing) throw new AppError("Reordering rule not found.", 404, ERROR_CODES.NOT_FOUND);

  await db.delete(reorderingRules).where(eq(reorderingRules.id, ruleId));
}
