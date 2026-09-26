import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { products } from "./products";
import { locations } from "./warehouses";

/**
 * inventory_ledger — APPEND-ONLY table.
 * No UPDATE or DELETE is ever performed on this table.
 * Every stock-changing operation inserts one or more rows here.
 */
export const inventoryLedger = pgTable("inventory_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 50 }).notNull(),
  movementType: varchar("movement_type", { length: 20 }).notNull(),
  // Allowed values: 'IN' | 'OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT'
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  fromLocationId: uuid("from_location_id").references(() => locations.id),
  toLocationId: uuid("to_location_id").references(() => locations.id),
  quantity: integer("quantity").notNull(),
  sourceDocumentId: uuid("source_document_id"),
  sourceDocumentType: varchar("source_document_type", { length: 30 }),
  // Allowed values: 'receipt' | 'delivery' | 'transfer' | 'adjustment'
  contact: varchar("contact", { length: 255 }),
  performedBy: uuid("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Idempotency keys
// ---------------------------------------------------------------------------

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: varchar("key", { length: 255 }).primaryKey(),
  responseBody: varchar("response_body", { length: 65535 }).notNull(),
  // Stored as JSON string; varchar is sufficient — avoids jsonb import complexity
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Reference number sequences (per warehouse + operation type)
// ---------------------------------------------------------------------------

export const referenceSequences = pgTable("reference_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  warehouseId: uuid("warehouse_id").notNull(),
  operationType: varchar("operation_type", { length: 10 }).notNull(),
  // Allowed values: 'IN' | 'OUT' | 'INT' | 'ADJ'
  lastSeq: integer("last_seq").notNull().default(0),
});
