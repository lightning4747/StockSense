/**
 * Seed script — inserts default data for a fresh StockSense installation.
 *
 * Inserts:
 *   - 1 admin user  (loginId: "admin", email from SEED_ADMIN_EMAIL env)
 *   - 1 warehouse   (name: "Main Warehouse", shortCode: "WH")
 *   - 1 location    (name: "Default Zone", shortCode: "A1")
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING.
 * Usage: npm run db:seed
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

  console.log("🌱 Seeding database...");

  // -------------------------------------------------------------------------
  // Target Users per REQUIREMENTS.md: Inventory Manager & Warehouse Staff
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
  console.log(`  ✔ Inventory Manager: loginId="${MANAGER_LOGIN_ID}", email="${MANAGER_EMAIL}"`);

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

  console.log(`  ✔ Warehouse Staff: loginId="${STAFF_LOGIN_ID}", email="${STAFF_EMAIL}"`);

  // -------------------------------------------------------------------------
  // Default warehouse
  // -------------------------------------------------------------------------
  await db
    .insert(schema.warehouses)
    .values({
      id: uuidv4(),
      name: "Main Warehouse",
      shortCode: "WH",
      address: "123 Default Street",
      createdBy: managerId,
      updatedBy: managerId,
    })
    .onConflictDoNothing({ target: schema.warehouses.shortCode });

  const [wh] = await db
    .select({ id: schema.warehouses.id })
    .from(schema.warehouses)
    .where(eq(schema.warehouses.shortCode, "WH"));
  const warehouseId = wh!.id;

  console.log('  ✔ Warehouse: shortCode="WH"');

  // -------------------------------------------------------------------------
  // Default location inside that warehouse
  // -------------------------------------------------------------------------
  const locationId = uuidv4();

  await db
    .insert(schema.locations)
    .values({
      id: locationId,
      warehouseId,
      name: "Default Zone",
      shortCode: "A1",
      createdBy: managerId,
      updatedBy: managerId,
    })
    .onConflictDoNothing();

  console.log('  ✔ Location: shortCode="A1" in warehouse "WH"');

  console.log("✅ Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
