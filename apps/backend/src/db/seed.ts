/**
 * Comprehensive seed script for StockSense IMS.
 *
 * Populates realistic, interconnected data across all entities:
 *   - Users: Manager & Warehouse Staff
 *   - Warehouses: Main Warehouse, Secondary Distribution Hub, Cold Storage
 *   - Locations: Inbound, Main Stacks, Picking, High Rack, Outbound
 *   - Categories: Raw Materials, Apparel & Footwear, Consumer Electronics, Packaging, Office Supplies
 *   - Products: 12 diverse products across categories with reorder rules
 *   - Stock Levels: Initial on-hand balances across locations
 *   - Operations:
 *       - Receipts (Done, Ready, Waiting, Draft) + Receipt Items spanning from Aug 2026 to late Sep 2026
 *       - Delivery Orders (Done, Waiting, Ready, Draft) + Delivery Items spanning across weeks
 *       - Internal Transfers (Done, Ready, Draft) + Transfer Items
 *   - Inventory Ledger: Immutable move history matching operations & adjustments, with dates before Sep 25
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING.
 * Usage: npm run db:seed --workspace=@stocksense/backend
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { hash } from "argon2";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import * as schema from "./schema";

const MANAGER_LOGIN_ID = "manager";
const MANAGER_EMAIL = "manager@stocksense.app";
const MANAGER_PASSWORD = "Manager@12345";

const STAFF_LOGIN_ID = "warehouse";
const STAFF_EMAIL = "staff@stocksense.app";
const STAFF_PASSWORD = "Staff@12345";

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🌱 Starting comprehensive database seed for StockSense IMS...");

  // -------------------------------------------------------------------------
  // 1. Users (Manager & Staff)
  // -------------------------------------------------------------------------
  const managerPasswordHash = await hash(MANAGER_PASSWORD);
  await db
    .insert(schema.users)
    .values({
      id: uuidv4(),
      loginId: MANAGER_LOGIN_ID,
      email: MANAGER_EMAIL,
      passwordHash: managerPasswordHash,
      role: "INVENTORY_MANAGER",
    })
    .onConflictDoNothing({ target: schema.users.loginId });

  const [managerUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.loginId, MANAGER_LOGIN_ID));
  const managerId = managerUser!.id;

  const staffPasswordHash = await hash(STAFF_PASSWORD);
  await db
    .insert(schema.users)
    .values({
      id: uuidv4(),
      loginId: STAFF_LOGIN_ID,
      email: STAFF_EMAIL,
      passwordHash: staffPasswordHash,
      role: "WAREHOUSE_STAFF",
    })
    .onConflictDoNothing({ target: schema.users.loginId });

  const [staffUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.loginId, STAFF_LOGIN_ID));
  const staffId = staffUser!.id;

  console.log(`  ✔ Users ready: manager (${MANAGER_LOGIN_ID}) & staff (${STAFF_LOGIN_ID})`);

  // -------------------------------------------------------------------------
  // 2. Warehouses & Locations
  // -------------------------------------------------------------------------
  const warehouseDefinitions = [
    {
      shortCode: "WH",
      name: "Main Fulfillment Center",
      address: "100 Logistics Blvd, Dock 4, Chicago, IL 60601",
      locations: [
        { shortCode: "A1", name: "Inbound Receiving Dock A" },
        { shortCode: "B1", name: "Aisle B - Heavy Storage" },
        { shortCode: "B2", name: "Aisle B - Fast Pick Shelf" },
        { shortCode: "C1", name: "Aisle C - High Rack Tier" },
        { shortCode: "OUT-1", name: "Outbound Dispatch Bay 1" },
      ],
    },
    {
      shortCode: "WH-EAST",
      name: "East Coast Regional Hub",
      address: "500 Harbor Parkway, Newark, NJ 07114",
      locations: [
        { shortCode: "DOCK-1", name: "Receiving Bay East" },
        { shortCode: "STK-A", name: "General Stocking Area" },
        { shortCode: "SHIP-1", name: "Outbound Staging Bay" },
      ],
    },
    {
      shortCode: "WH-WEST",
      name: "West Coast Gateway",
      address: "880 Pacific Logistics Way, Reno, NV 89502",
      locations: [
        { shortCode: "RCV-1", name: "Inbound Receiving" },
        { shortCode: "ZONE-A", name: "Zone A Automated Bins" },
        { shortCode: "EXP-1", name: "Expedited Shipping Dock" },
      ],
    },
  ];

  const locationMap = new Map<string, string>(); // "WH:A1" -> locationId
  const warehouseMap = new Map<string, string>(); // "WH" -> warehouseId

  for (const whDef of warehouseDefinitions) {
    await db
      .insert(schema.warehouses)
      .values({
        id: uuidv4(),
        name: whDef.name,
        shortCode: whDef.shortCode,
        address: whDef.address,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.warehouses.shortCode });

    const [wh] = await db
      .select({ id: schema.warehouses.id })
      .from(schema.warehouses)
      .where(eq(schema.warehouses.shortCode, whDef.shortCode));
    const whId = wh!.id;
    warehouseMap.set(whDef.shortCode, whId);

    for (const locDef of whDef.locations) {
      await db
        .insert(schema.locations)
        .values({
          id: uuidv4(),
          warehouseId: whId,
          name: locDef.name,
          shortCode: locDef.shortCode,
          createdBy: managerId,
          updatedBy: managerId,
        })
        .onConflictDoNothing();

      const [loc] = await db
        .select({ id: schema.locations.id })
        .from(schema.locations)
        .where(eq(schema.locations.shortCode, locDef.shortCode));
      if (loc) {
        locationMap.set(`${whDef.shortCode}:${locDef.shortCode}`, loc.id);
      }
    }
  }
  console.log(`  ✔ Warehouses (3) & Locations (11) initialized.`);

  // -------------------------------------------------------------------------
  // 3. Product Categories
  // -------------------------------------------------------------------------
  const categoryNames = [
    "Raw Materials",
    "Apparel & Footwear",
    "Consumer Electronics",
    "Packaging & Shipping",
    "Office Supplies",
  ];

  const categoryMap = new Map<string, string>();
  for (const catName of categoryNames) {
    await db
      .insert(schema.categories)
      .values({
        id: uuidv4(),
        name: catName,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.categories.name });

    const [cat] = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.name, catName));
    if (cat) {
      categoryMap.set(catName, cat.id);
    }
  }
  console.log(`  ✔ Categories (${categoryNames.length}) ready.`);

  // -------------------------------------------------------------------------
  // 4. Products with realistic metrics & initial stock
  // -------------------------------------------------------------------------
  const productDefinitions = [
    {
      sku: "PROD-SOCK-001",
      name: "Merino Wool Performance Socks (Pair)",
      category: "Apparel & Footwear",
      unitOfMeasure: "Pairs",
      costPerUnit: "14.50",
      reorderPoint: 200,
      reorderQuantity: 500,
      initialStock: [
        { loc: "WH:B1", onHand: 450, reserved: 25 },
        { loc: "WH-EAST:STK-A", onHand: 180, reserved: 10 },
      ],
    },
    {
      sku: "PROD-SOCK-002",
      name: "Compression Thermal Running Socks",
      category: "Apparel & Footwear",
      unitOfMeasure: "Pairs",
      costPerUnit: "18.00",
      reorderPoint: 100,
      reorderQuantity: 300,
      initialStock: [
        { loc: "WH:B1", onHand: 75, reserved: 0 }, // Low Stock! (75 < 100)
        { loc: "WH-WEST:ZONE-A", onHand: 120, reserved: 15 },
      ],
    },
    {
      sku: "PROD-ELEC-001",
      name: "Smart Inventory RFID Scanner Handheld",
      category: "Consumer Electronics",
      unitOfMeasure: "Units",
      costPerUnit: "299.00",
      reorderPoint: 15,
      reorderQuantity: 30,
      initialStock: [
        { loc: "WH:C1", onHand: 24, reserved: 4 },
        { loc: "WH-EAST:STK-A", onHand: 8, reserved: 0 }, // Low Stock! (8 < 15)
      ],
    },
    {
      sku: "PROD-ELEC-002",
      name: "Industrial Thermal Barcode Label Printer",
      category: "Consumer Electronics",
      unitOfMeasure: "Units",
      costPerUnit: "450.00",
      reorderPoint: 10,
      reorderQuantity: 20,
      initialStock: [
        { loc: "WH:C1", onHand: 14, reserved: 2 },
      ],
    },
    {
      sku: "PROD-PKG-001",
      name: "Recycled Corrugated Shipping Box (Medium)",
      category: "Packaging & Shipping",
      unitOfMeasure: "Bundles (25pcs)",
      costPerUnit: "22.50",
      reorderPoint: 150,
      reorderQuantity: 400,
      initialStock: [
        { loc: "WH:B2", onHand: 520, reserved: 50 },
        { loc: "WH-EAST:STK-A", onHand: 210, reserved: 0 },
        { loc: "WH-WEST:ZONE-A", onHand: 300, reserved: 20 },
      ],
    },
    {
      sku: "PROD-PKG-002",
      name: "Biodegradable Bubble Wrap Roll (200m)",
      category: "Packaging & Shipping",
      unitOfMeasure: "Rolls",
      costPerUnit: "35.00",
      reorderPoint: 40,
      reorderQuantity: 100,
      initialStock: [
        { loc: "WH:B2", onHand: 0, reserved: 0 }, // Out of stock!
        { loc: "WH-EAST:STK-A", onHand: 35, reserved: 5 }, // Low stock!
      ],
    },
    {
      sku: "PROD-RAW-001",
      name: "Organic Combed Cotton Yarn (5kg Spool)",
      category: "Raw Materials",
      unitOfMeasure: "Spools",
      costPerUnit: "42.00",
      reorderPoint: 80,
      reorderQuantity: 200,
      initialStock: [
        { loc: "WH:B1", onHand: 160, reserved: 20 },
      ],
    },
    {
      sku: "PROD-RAW-002",
      name: "Elastic Spandex Filament Thread (1kg)",
      category: "Raw Materials",
      unitOfMeasure: "Spools",
      costPerUnit: "19.50",
      reorderPoint: 50,
      reorderQuantity: 120,
      initialStock: [
        { loc: "WH:B1", onHand: 85, reserved: 0 },
      ],
    },
    {
      sku: "PROD-OFF-001",
      name: "Industrial Packing Tape Rolls (6-Pack)",
      category: "Office Supplies",
      unitOfMeasure: "Packs",
      costPerUnit: "12.00",
      reorderPoint: 100,
      reorderQuantity: 250,
      initialStock: [
        { loc: "WH:B2", onHand: 310, reserved: 15 },
        { loc: "WH-WEST:ZONE-A", onHand: 95, reserved: 0 },
      ],
    },
    {
      sku: "PROD-SOCK-003",
      name: "Bamboo Fiber Breathable Ankle Socks",
      category: "Apparel & Footwear",
      unitOfMeasure: "Pairs",
      costPerUnit: "9.20",
      reorderPoint: 250,
      reorderQuantity: 600,
      initialStock: [
        { loc: "WH:B1", onHand: 0, reserved: 0 }, // Out of stock item!
      ],
    },
  ];

  const productMap = new Map<string, string>(); // sku -> productId

  for (const pDef of productDefinitions) {
    await db
      .insert(schema.products)
      .values({
        id: uuidv4(),
        sku: pDef.sku,
        name: pDef.name,
        categoryId: categoryMap.get(pDef.category) || null,
        unitOfMeasure: pDef.unitOfMeasure,
        costPerUnit: pDef.costPerUnit,
        reorderPoint: pDef.reorderPoint,
        reorderQuantity: pDef.reorderQuantity,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.products.sku });

    const [prod] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.sku, pDef.sku));
    const prodId = prod!.id;
    productMap.set(pDef.sku, prodId);

    // Initial stock levels
    for (const stock of pDef.initialStock) {
      const locId = locationMap.get(stock.loc);
      if (locId) {
        await db
          .insert(schema.stockLevels)
          .values({
            id: uuidv4(),
            productId: prodId,
            locationId: locId,
            onHand: stock.onHand,
            reserved: stock.reserved,
          })
          .onConflictDoNothing();
      }
    }
  }
  console.log(`  ✔ Products (${productDefinitions.length}) and stock levels seeded.`);

  // -------------------------------------------------------------------------
  // 5. Operations: Receipts (Incoming Stock) - Diverse historical & upcoming dates
  // -------------------------------------------------------------------------
  const mainWhId = warehouseMap.get("WH")!;
  const mainInboundLoc = locationMap.get("WH:A1")!;
  const mainAisleB1 = locationMap.get("WH:B1")!;
  const mainOutboundLoc = locationMap.get("WH:OUT-1")!;
  const eastWhId = warehouseMap.get("WH-EAST")!;
  const eastDockLoc = locationMap.get("WH-EAST:DOCK-1")!;
  const eastStkLoc = locationMap.get("WH-EAST:STK-A")!;
  const westWhId = warehouseMap.get("WH-WEST")!;
  const westRcvLoc = locationMap.get("WH-WEST:RCV-1")!;
  const westZoneLoc = locationMap.get("WH-WEST:ZONE-A")!;

  const receiptsData = [
    // Pre-Sep 25 Historical Receipts (August & Mid September 2026)
    {
      reference: "REC-2026-0000A",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "Apex Yarn Mills International",
      scheduledAt: new Date("2026-08-15T09:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-08-15T14:30:00Z"),
      items: [
        { sku: "PROD-RAW-001", quantity: 200, receivedQuantity: 200 },
        { sku: "PROD-RAW-002", quantity: 150, receivedQuantity: 150 },
      ],
    },
    {
      reference: "REC-2026-0000B",
      warehouseId: eastWhId,
      destinationLocationId: eastDockLoc,
      supplierName: "Cascade Textile Mills",
      scheduledAt: new Date("2026-09-01T10:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-01T16:00:00Z"),
      items: [
        { sku: "PROD-SOCK-001", quantity: 500, receivedQuantity: 500 },
        { sku: "PROD-SOCK-002", quantity: 250, receivedQuantity: 250 },
      ],
    },
    {
      reference: "REC-2026-0000C",
      warehouseId: westWhId,
      destinationLocationId: westRcvLoc,
      supplierName: "Global Tech Hardware Corp",
      scheduledAt: new Date("2026-09-12T08:30:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-12T13:45:00Z"),
      items: [
        { sku: "PROD-ELEC-001", quantity: 40, receivedQuantity: 40 },
        { sku: "PROD-ELEC-002", quantity: 25, receivedQuantity: 25 },
      ],
    },
    {
      reference: "REC-2026-0000D",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "EcoPack Sustainable Solutions",
      scheduledAt: new Date("2026-09-18T11:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-18T15:20:00Z"),
      items: [
        { sku: "PROD-PKG-001", quantity: 600, receivedQuantity: 600 },
        { sku: "PROD-PKG-002", quantity: 150, receivedQuantity: 150 },
      ],
    },
    // Near-term & Current Receipts (Late Sep 2026)
    {
      reference: "REC-2026-0001",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "Apex Yarn Mills International",
      scheduledAt: new Date("2026-09-21T09:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-22T10:15:00Z"),
      items: [
        { sku: "PROD-RAW-001", quantity: 150, receivedQuantity: 150 },
        { sku: "PROD-RAW-002", quantity: 80, receivedQuantity: 80 },
      ],
    },
    {
      reference: "REC-2026-0002",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "Global Tech Hardware Corp",
      scheduledAt: new Date("2026-09-24T14:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-25T11:30:00Z"),
      items: [
        { sku: "PROD-ELEC-001", quantity: 20, receivedQuantity: 20 },
        { sku: "PROD-ELEC-002", quantity: 10, receivedQuantity: 10 },
      ],
    },
    {
      reference: "REC-2026-0003",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "EcoPack Sustainable Solutions",
      scheduledAt: new Date("2026-09-25T08:00:00Z"), // Scheduled yesterday (Overdue / Late)
      status: "READY",
      items: [
        { sku: "PROD-PKG-001", quantity: 300, receivedQuantity: 0 },
        { sku: "PROD-PKG-002", quantity: 100, receivedQuantity: 0 },
      ],
    },
    {
      reference: "REC-2026-0004",
      warehouseId: eastWhId,
      destinationLocationId: eastDockLoc,
      supplierName: "Cascade Textile Mills",
      scheduledAt: new Date("2026-09-29T10:00:00Z"), // upcoming future
      status: "WAITING",
      items: [
        { sku: "PROD-SOCK-001", quantity: 350, receivedQuantity: 0 },
        { sku: "PROD-SOCK-002", quantity: 200, receivedQuantity: 0 },
      ],
    },
    {
      reference: "REC-2026-0005",
      warehouseId: mainWhId,
      destinationLocationId: mainInboundLoc,
      supplierName: "BioFiber Supply Co.",
      scheduledAt: new Date("2026-10-04T12:00:00Z"),
      status: "DRAFT",
      items: [
        { sku: "PROD-SOCK-003", quantity: 600, receivedQuantity: 0 },
      ],
    },
  ];

  for (const rData of receiptsData) {
    await db
      .insert(schema.receipts)
      .values({
        id: uuidv4(),
        reference: rData.reference,
        warehouseId: rData.warehouseId,
        destinationLocationId: rData.destinationLocationId,
        supplierName: rData.supplierName,
        scheduledAt: rData.scheduledAt,
        status: rData.status,
        validatedAt: rData.validatedAt || null,
        responsibleUserId: rData.status === "DONE" ? staffId : managerId,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.receipts.reference });

    const [rcpt] = await db
      .select({ id: schema.receipts.id })
      .from(schema.receipts)
      .where(eq(schema.receipts.reference, rData.reference));
    const rcptId = rcpt!.id;

    for (const item of rData.items) {
      const prodId = productMap.get(item.sku);
      if (prodId) {
        await db
          .insert(schema.receiptItems)
          .values({
            id: uuidv4(),
            receiptId: rcptId,
            productId: prodId,
            quantity: item.quantity,
            receivedQuantity: item.receivedQuantity,
          })
          .onConflictDoNothing();

        // If DONE, record in ledger with matching historical timestamp
        if (rData.status === "DONE") {
          await db
            .insert(schema.inventoryLedger)
            .values({
              id: uuidv4(),
              reference: rData.reference,
              movementType: "IN",
              productId: prodId,
              toLocationId: rData.destinationLocationId,
              quantity: item.receivedQuantity,
              sourceDocumentId: rcptId,
              sourceDocumentType: "receipt",
              contact: rData.supplierName,
              performedBy: staffId,
              performedAt: rData.validatedAt || rData.scheduledAt,
              createdAt: rData.validatedAt || rData.scheduledAt,
            })
            .onConflictDoNothing();
        }
      }
    }
  }
  console.log(`  ✔ Receipts (${receiptsData.length}) and historical IN ledger records seeded.`);

  // -------------------------------------------------------------------------
  // 6. Operations: Delivery Orders (Outgoing Stock) - Diverse historical & upcoming dates
  // -------------------------------------------------------------------------
  const deliveriesData = [
    // Pre-Sep 25 Historical Deliveries
    {
      reference: "DEL-2026-0000A",
      warehouseId: mainWhId,
      sourceLocationId: mainAisleB1,
      deliveryAddress: "Nordic Athletic Gear, 450 King St, Toronto, Canada",
      scheduledAt: new Date("2026-08-20T10:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-08-20T16:45:00Z"),
      items: [
        { sku: "PROD-SOCK-001", quantity: 120 },
        { sku: "PROD-SOCK-002", quantity: 60 },
      ],
    },
    {
      reference: "DEL-2026-0000B",
      warehouseId: westWhId,
      sourceLocationId: westZoneLoc,
      deliveryAddress: "Pacific Retailers Association, Seattle, WA",
      scheduledAt: new Date("2026-09-08T09:30:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-08T15:00:00Z"),
      items: [
        { sku: "PROD-ELEC-001", quantity: 12 },
        { sku: "PROD-PKG-001", quantity: 80 },
      ],
    },
    {
      reference: "DEL-2026-0000C",
      warehouseId: eastWhId,
      sourceLocationId: eastStkLoc,
      deliveryAddress: "Boston Outfitters Co., Boston, MA",
      scheduledAt: new Date("2026-09-16T11:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-16T17:10:00Z"),
      items: [
        { sku: "PROD-SOCK-001", quantity: 95 },
      ],
    },
    // Near-term & Current Deliveries
    {
      reference: "DEL-2026-0001",
      warehouseId: mainWhId,
      sourceLocationId: mainAisleB1,
      deliveryAddress: "Nordic Athletic Gear, 450 King St, Toronto, Canada",
      scheduledAt: new Date("2026-09-23T11:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-24T14:30:00Z"),
      items: [
        { sku: "PROD-SOCK-001", quantity: 80 },
        { sku: "PROD-SOCK-002", quantity: 40 },
      ],
    },
    {
      reference: "DEL-2026-0002",
      warehouseId: mainWhId,
      sourceLocationId: mainAisleB1,
      deliveryAddress: "Midwest Outfitters Inc., 89 Commerce Way, Indianapolis, IN",
      scheduledAt: new Date("2026-09-24T09:00:00Z"), // Overdue!
      status: "WAITING",
      items: [
        { sku: "PROD-SOCK-001", quantity: 50 },
        { sku: "PROD-PKG-001", quantity: 20 },
      ],
    },
    {
      reference: "DEL-2026-0003",
      warehouseId: eastWhId,
      sourceLocationId: eastStkLoc,
      deliveryAddress: "TechLab Solutions HQ, 12 Tech Drive, Boston, MA",
      scheduledAt: new Date("2026-09-28T14:00:00Z"),
      status: "READY",
      items: [
        { sku: "PROD-ELEC-001", quantity: 5 },
      ],
    },
    {
      reference: "DEL-2026-0004",
      warehouseId: mainWhId,
      sourceLocationId: mainAisleB1,
      deliveryAddress: "Summit Running Co, 1200 Peak Ave, Denver, CO",
      scheduledAt: new Date("2026-10-02T10:00:00Z"),
      status: "DRAFT",
      items: [
        { sku: "PROD-SOCK-002", quantity: 30 },
      ],
    },
  ];

  for (const dData of deliveriesData) {
    await db
      .insert(schema.deliveryOrders)
      .values({
        id: uuidv4(),
        reference: dData.reference,
        warehouseId: dData.warehouseId,
        sourceLocationId: dData.sourceLocationId,
        deliveryAddress: dData.deliveryAddress,
        scheduledAt: dData.scheduledAt,
        status: dData.status,
        validatedAt: dData.validatedAt || null,
        responsibleUserId: dData.status === "DONE" ? staffId : managerId,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.deliveryOrders.reference });

    const [deliv] = await db
      .select({ id: schema.deliveryOrders.id })
      .from(schema.deliveryOrders)
      .where(eq(schema.deliveryOrders.reference, dData.reference));
    const delivId = deliv!.id;

    for (const item of dData.items) {
      const prodId = productMap.get(item.sku);
      if (prodId) {
        await db
          .insert(schema.deliveryItems)
          .values({
            id: uuidv4(),
            deliveryId: delivId,
            productId: prodId,
            requestedQuantity: item.quantity,
          })
          .onConflictDoNothing();

        // If DONE, record in ledger as OUT with historic dates
        if (dData.status === "DONE") {
          await db
            .insert(schema.inventoryLedger)
            .values({
              id: uuidv4(),
              reference: dData.reference,
              movementType: "OUT",
              productId: prodId,
              fromLocationId: dData.sourceLocationId,
              quantity: item.quantity,
              sourceDocumentId: delivId,
              sourceDocumentType: "delivery",
              contact: dData.deliveryAddress,
              performedBy: staffId,
              performedAt: dData.validatedAt || dData.scheduledAt,
              createdAt: dData.validatedAt || dData.scheduledAt,
            })
            .onConflictDoNothing();
        }
      }
    }
  }
  console.log(`  ✔ Deliveries (${deliveriesData.length}) and historical OUT ledger records seeded.`);

  // -------------------------------------------------------------------------
  // 7. Operations: Internal Transfers
  // -------------------------------------------------------------------------
  const transfersData = [
    {
      reference: "TRF-2026-0000A",
      warehouseId: mainWhId,
      sourceLocationId: mainInboundLoc,
      destinationLocationId: mainAisleB1,
      scheduledAt: new Date("2026-08-25T09:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-08-25T11:30:00Z"),
      items: [
        { sku: "PROD-RAW-001", quantity: 80 },
      ],
    },
    {
      reference: "TRF-2026-0000B",
      warehouseId: eastWhId,
      sourceLocationId: eastDockLoc,
      destinationLocationId: eastStkLoc,
      scheduledAt: new Date("2026-09-10T14:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-10T16:15:00Z"),
      items: [
        { sku: "PROD-SOCK-001", quantity: 150 },
      ],
    },
    {
      reference: "TRF-2026-0001",
      warehouseId: mainWhId,
      sourceLocationId: mainInboundLoc,
      destinationLocationId: mainAisleB1,
      scheduledAt: new Date("2026-09-22T08:00:00Z"),
      status: "DONE",
      validatedAt: new Date("2026-09-22T10:00:00Z"),
      items: [
        { sku: "PROD-RAW-001", quantity: 100 },
      ],
    },
    {
      reference: "TRF-2026-0002",
      warehouseId: mainWhId,
      sourceLocationId: mainAisleB1,
      destinationLocationId: mainOutboundLoc,
      scheduledAt: new Date("2026-09-27T10:00:00Z"),
      status: "READY",
      items: [
        { sku: "PROD-SOCK-001", quantity: 40 },
      ],
    },
    {
      reference: "TRF-2026-0003",
      warehouseId: eastWhId,
      sourceLocationId: eastDockLoc,
      destinationLocationId: eastStkLoc,
      scheduledAt: new Date("2026-10-01T15:00:00Z"),
      status: "DRAFT",
      items: [
        { sku: "PROD-SOCK-002", quantity: 50 },
      ],
    },
  ];

  for (const tData of transfersData) {
    await db
      .insert(schema.transfers)
      .values({
        id: uuidv4(),
        reference: tData.reference,
        warehouseId: tData.warehouseId,
        sourceLocationId: tData.sourceLocationId,
        destinationLocationId: tData.destinationLocationId,
        scheduledAt: tData.scheduledAt,
        status: tData.status,
        validatedAt: tData.validatedAt || null,
        responsibleUserId: staffId,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing({ target: schema.transfers.reference });

    const [trf] = await db
      .select({ id: schema.transfers.id })
      .from(schema.transfers)
      .where(eq(schema.transfers.reference, tData.reference));
    const trfId = trf!.id;

    for (const item of tData.items) {
      const prodId = productMap.get(item.sku);
      if (prodId) {
        await db
          .insert(schema.transferItems)
          .values({
            id: uuidv4(),
            transferId: trfId,
            productId: prodId,
            quantity: item.quantity,
          })
          .onConflictDoNothing();

        // If DONE, record TRANSFER_OUT and TRANSFER_IN in ledger
        if (tData.status === "DONE") {
          const timestamp = tData.validatedAt || tData.scheduledAt;
          await db
            .insert(schema.inventoryLedger)
            .values({
              id: uuidv4(),
              reference: tData.reference,
              movementType: "TRANSFER_OUT",
              productId: prodId,
              fromLocationId: tData.sourceLocationId,
              toLocationId: tData.destinationLocationId,
              quantity: item.quantity,
              sourceDocumentId: trfId,
              sourceDocumentType: "transfer",
              performedBy: staffId,
              performedAt: timestamp,
              createdAt: timestamp,
            })
            .onConflictDoNothing();

          await db
            .insert(schema.inventoryLedger)
            .values({
              id: uuidv4(),
              reference: tData.reference,
              movementType: "TRANSFER_IN",
              productId: prodId,
              fromLocationId: tData.sourceLocationId,
              toLocationId: tData.destinationLocationId,
              quantity: item.quantity,
              sourceDocumentId: trfId,
              sourceDocumentType: "transfer",
              performedBy: staffId,
              performedAt: timestamp,
              createdAt: timestamp,
            })
            .onConflictDoNothing();
        }
      }
    }
  }
  console.log(`  ✔ Internal Transfers (${transfersData.length}) and transfer ledger movements seeded.`);

  // -------------------------------------------------------------------------
  // 8. Reordering Rules
  // -------------------------------------------------------------------------
  const sock1Id = productMap.get("PROD-SOCK-001");
  const pkg1Id = productMap.get("PROD-PKG-001");
  if (sock1Id) {
    await db
      .insert(schema.reorderingRules)
      .values({
        id: uuidv4(),
        productId: sock1Id,
        warehouseId: mainWhId,
        locationId: mainAisleB1,
        reorderPoint: 200,
        reorderQuantity: 500,
        enabled: true,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing();
  }
  if (pkg1Id) {
    await db
      .insert(schema.reorderingRules)
      .values({
        id: uuidv4(),
        productId: pkg1Id,
        warehouseId: mainWhId,
        locationId: mainAisleB1,
        reorderPoint: 150,
        reorderQuantity: 400,
        enabled: true,
        createdBy: managerId,
        updatedBy: managerId,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✔ Reordering rules configured.`);

  console.log("🎉 Complete database seeding finished successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
