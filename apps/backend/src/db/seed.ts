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
import { Pool } from "pg";
import { hash } from "argon2";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import * as schema from "./schema";

const SEED_ADMIN_LOGIN_ID = "admin";
const SEED_ADMIN_EMAIL = process.env["SEED_ADMIN_EMAIL"] ?? "admin@stocksense.app";
const SEED_ADMIN_PASSWORD = process.env["SEED_ADMIN_PASSWORD"] ?? "Admin@12345";

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🌱 Seeding database...");

  // -------------------------------------------------------------------------
  // Admin user
  // -------------------------------------------------------------------------
  const adminId = uuidv4();
  const passwordHash = await hash(SEED_ADMIN_PASSWORD);

  await db
    .insert(schema.users)
    .values({
      id: adminId,
      loginId: SEED_ADMIN_LOGIN_ID,
      email: SEED_ADMIN_EMAIL,
      passwordHash,
    })
    .onConflictDoNothing({ target: schema.users.loginId });

  console.log(`  ✔ Admin user: loginId="${SEED_ADMIN_LOGIN_ID}", email="${SEED_ADMIN_EMAIL}"`);

  // -------------------------------------------------------------------------
  // Default warehouse
  // -------------------------------------------------------------------------
  const warehouseId = uuidv4();

  await db
    .insert(schema.warehouses)
    .values({
      id: warehouseId,
      name: "Main Warehouse",
      shortCode: "WH",
      address: "123 Default Street",
      createdBy: adminId,
      updatedBy: adminId,
    })
    .onConflictDoNothing({ target: schema.warehouses.shortCode });

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
      createdBy: adminId,
      updatedBy: adminId,
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
