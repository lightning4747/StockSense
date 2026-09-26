import { ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { products, receipts, deliveryOrders, transfers, inventoryLedger } from "../../db/schema";

type SearchType = "product" | "receipt" | "delivery" | "transfer" | "move";

// ---------------------------------------------------------------------------
// GET /search — fuzzy search across all document types
// ---------------------------------------------------------------------------
export async function globalSearch(q: string, type?: SearchType, limit = 20) {
  const results: Array<{ type: string; id: string; label: string }> = [];
  const lim = Math.min(limit, 50);

  if (!type || type === "product") {
    const rows = await db
      .select({ id: products.id, sku: products.sku, name: products.name })
      .from(products)
      .where(or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`)))
      .limit(lim);
    rows.forEach((r) => results.push({ type: "product", id: r.id, label: `${r.sku} - ${r.name}` }));
  }

  if (!type || type === "receipt") {
    const rows = await db
      .select({ id: receipts.id, reference: receipts.reference })
      .from(receipts)
      .where(ilike(receipts.reference, `%${q}%`))
      .limit(lim);
    rows.forEach((r) => results.push({ type: "receipt", id: r.id, label: r.reference }));
  }

  if (!type || type === "delivery") {
    const rows = await db
      .select({ id: deliveryOrders.id, reference: deliveryOrders.reference })
      .from(deliveryOrders)
      .where(ilike(deliveryOrders.reference, `%${q}%`))
      .limit(lim);
    rows.forEach((r) => results.push({ type: "delivery", id: r.id, label: r.reference }));
  }

  if (!type || type === "transfer") {
    const rows = await db
      .select({ id: transfers.id, reference: transfers.reference })
      .from(transfers)
      .where(ilike(transfers.reference, `%${q}%`))
      .limit(lim);
    rows.forEach((r) => results.push({ type: "transfer", id: r.id, label: r.reference }));
  }

  if (!type || type === "move") {
    const rows = await db
      .select({ id: inventoryLedger.id, reference: inventoryLedger.reference })
      .from(inventoryLedger)
      .where(ilike(inventoryLedger.reference, `%${q}%`))
      .limit(lim);
    rows.forEach((r) => results.push({ type: "move", id: r.id, label: r.reference }));
  }

  return results.slice(0, lim);
}
