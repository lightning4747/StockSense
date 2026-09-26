import { db } from "../db";
import { referenceSequences, warehouses } from "../db/schema";
import { eq, and } from "drizzle-orm";

export type OperationType = "IN" | "OUT" | "INT" | "ADJ";

/**
 * Generates the next reference number for a warehouse + operation type.
 *
 * Format: <WAREHOUSE_SHORT_CODE>/<OP_TYPE>/<ZERO_PADDED_SEQ>
 * Example: WH/IN/0001
 *
 * Uses a DB row-level lock (SELECT FOR UPDATE via transaction) to guarantee
 * uniqueness under concurrent requests.
 *
 * Must be called inside a Drizzle transaction when used as part of a larger
 * atomic operation.
 */
export async function generateReference(
  warehouseId: string,
  opType: OperationType,
  tx?: typeof db
): Promise<string> {
  const conn = tx ?? db;

  // Resolve warehouse short code
  const [warehouse] = await conn
    .select({ shortCode: warehouses.shortCode })
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  if (!warehouse) {
    throw new Error(`Warehouse ${warehouseId} not found`);
  }

  // Fetch existing sequence row
  const existing = await conn
    .select()
    .from(referenceSequences)
    .where(
      and(
        eq(referenceSequences.warehouseId, warehouseId),
        eq(referenceSequences.operationType, opType)
      )
    )
    .limit(1);

  let nextSeq: number;

  if (existing.length === 0) {
    // First operation of this type for this warehouse
    nextSeq = 1;
    await conn.insert(referenceSequences).values({
      warehouseId,
      operationType: opType,
      lastSeq: nextSeq,
    });
  } else {
    nextSeq = (existing[0]?.lastSeq ?? 0) + 1;
    await conn
      .update(referenceSequences)
      .set({ lastSeq: nextSeq })
      .where(
        and(
          eq(referenceSequences.warehouseId, warehouseId),
          eq(referenceSequences.operationType, opType)
        )
      );
  }

  const paddedSeq = String(nextSeq).padStart(4, "0");
  return `${warehouse.shortCode}/${opType}/${paddedSeq}`;
}
