import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { warehouses, locations } from "./warehouses";
import { products } from "./products";

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  destinationLocationId: uuid("destination_location_id")
    .notNull()
    .references(() => locations.id),
  supplierName: varchar("supplier_name", { length: 255 }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("DRAFT"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const receiptItems = pgTable("receipt_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  receivedQuantity: integer("received_quantity").notNull().default(0),
},
(t) => [
  check("receipt_items_quantity_positive", sql`${t.quantity} > 0`),
]);

// ---------------------------------------------------------------------------
// Delivery Orders
// ---------------------------------------------------------------------------

export const deliveryOrders = pgTable("delivery_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  sourceLocationId: uuid("source_location_id")
    .notNull()
    .references(() => locations.id),
  deliveryAddress: text("delivery_address"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("DRAFT"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const deliveryItems = pgTable("delivery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveryOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  requestedQuantity: integer("requested_quantity").notNull(),
},
(t) => [
  check("delivery_items_qty_positive", sql`${t.requestedQuantity} > 0`),
]);

// ---------------------------------------------------------------------------
// Internal Transfers
// ---------------------------------------------------------------------------

export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  sourceLocationId: uuid("source_location_id")
    .notNull()
    .references(() => locations.id),
  destinationLocationId: uuid("destination_location_id")
    .notNull()
    .references(() => locations.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("DRAFT"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const transferItems = pgTable("transfer_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferId: uuid("transfer_id")
    .notNull()
    .references(() => transfers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
},
(t) => [
  check("transfer_items_qty_positive", sql`${t.quantity} > 0`),
]);
