/**
 * Run this script to apply all pending Drizzle migrations.
 * Usage: npm run db:migrate
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";
import "dotenv/config";
import { env } from "../config/env";

async function runMigrations() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("⏳ Running migrations...");

  await migrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });

  console.log("✅ Migrations applied successfully.");
  await pool.end();
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
