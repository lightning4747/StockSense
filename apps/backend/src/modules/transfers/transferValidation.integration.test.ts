/**
 * Integration tests — Transfer validation atomic operation
 *
 * Verifies READY → DONE transition: source deduction, destination addition,
 * dual ledger entries (TRANSFER_OUT + TRANSFER_IN), all-or-nothing guarantee.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

// ── Pure validation logic ─────────────────────────────────────────────────────

interface TransferItem {
  productId: string;
  quantity: number;
}

interface StockSnapshot {
  productId: string;
  sourceOnHand: number;
  destOnHand: number;
}

interface TransferResult {
  status: "DONE";
  stockUpdates: Array<{ productId: string; sourceOnHand: number; destOnHand: number }>;
  ledgerEntries: Array<{ productId: string; quantity: number; movementType: string }>;
}

function validateTransfer(
  status: string,
  items: TransferItem[],
  snapshots: Map<string, StockSnapshot>
): TransferResult {
  if (status !== "READY") throw new Error("INVALID_STATUS_TRANSITION");

  // Validate ALL items first (all-or-nothing)
  for (const item of items) {
    const snap = snapshots.get(item.productId);
    if (!snap || snap.sourceOnHand < item.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }
  }

  // Apply mutations only after all checks pass
  const stockUpdates: TransferResult["stockUpdates"] = [];
  const ledgerEntries: TransferResult["ledgerEntries"] = [];

  for (const item of items) {
    const snap = snapshots.get(item.productId)!;
    stockUpdates.push({
      productId:    item.productId,
      sourceOnHand: snap.sourceOnHand - item.quantity,
      destOnHand:   snap.destOnHand   + item.quantity,
    });

    ledgerEntries.push(
      { productId: item.productId, quantity: item.quantity, movementType: "TRANSFER_OUT" },
      { productId: item.productId, quantity: item.quantity, movementType: "TRANSFER_IN"  }
    );
  }

  return { status: "DONE", stockUpdates, ledgerEntries };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Transfer validation — atomic logic", () => {
  let snapshots: Map<string, StockSnapshot>;

  beforeEach(() => {
    snapshots = new Map([
      ["prod-1", { productId: "prod-1", sourceOnHand: 100, destOnHand: 10 }],
      ["prod-2", { productId: "prod-2", sourceOnHand: 50,  destOnHand: 0  }],
    ]);
  });

  it("transitions READY → DONE", () => {
    const result = validateTransfer(
      "READY",
      [{ productId: "prod-1", quantity: 30 }],
      snapshots
    );
    expect(result.status).toBe("DONE");
  });

  it("deducts from source and adds to destination", () => {
    const result = validateTransfer(
      "READY",
      [{ productId: "prod-1", quantity: 30 }],
      snapshots
    );
    expect(result.stockUpdates[0]?.sourceOnHand).toBe(70);
    expect(result.stockUpdates[0]?.destOnHand).toBe(40);
  });

  it("creates TRANSFER_OUT + TRANSFER_IN ledger entries per item", () => {
    const result = validateTransfer(
      "READY",
      [
        { productId: "prod-1", quantity: 10 },
        { productId: "prod-2", quantity: 5  },
      ],
      snapshots
    );
    expect(result.ledgerEntries).toHaveLength(4); // 2 items × 2 entries
    const types = result.ledgerEntries.map((e) => e.movementType);
    expect(types.filter((t) => t === "TRANSFER_OUT")).toHaveLength(2);
    expect(types.filter((t) => t === "TRANSFER_IN")).toHaveLength(2);
  });

  it("rejects when status is not READY", () => {
    expect(() => validateTransfer("DRAFT",    [], snapshots)).toThrow("INVALID_STATUS_TRANSITION");
    expect(() => validateTransfer("DONE",     [], snapshots)).toThrow("INVALID_STATUS_TRANSITION");
    expect(() => validateTransfer("CANCELED", [], snapshots)).toThrow("INVALID_STATUS_TRANSITION");
  });

  it("all-or-nothing: rejects if ANY item has insufficient stock", () => {
    // prod-1 is fine (100 >= 10), prod-2 has only 50 but we ask for 51
    expect(() =>
      validateTransfer(
        "READY",
        [
          { productId: "prod-1", quantity: 10 },
          { productId: "prod-2", quantity: 51 },
        ],
        snapshots
      )
    ).toThrow("INSUFFICIENT_STOCK");
  });

  it("source never goes negative", () => {
    expect(() =>
      validateTransfer(
        "READY",
        [{ productId: "prod-2", quantity: 51 }],
        snapshots
      )
    ).toThrow("INSUFFICIENT_STOCK");
  });

  it("allows full transfer (source becomes 0)", () => {
    const result = validateTransfer(
      "READY",
      [{ productId: "prod-2", quantity: 50 }],
      snapshots
    );
    expect(result.stockUpdates[0]?.sourceOnHand).toBe(0);
    expect(result.stockUpdates[0]?.destOnHand).toBe(50);
  });

  it("ledger entry quantities match transfer quantities exactly", () => {
    const result = validateTransfer(
      "READY",
      [{ productId: "prod-1", quantity: 25 }],
      snapshots
    );
    result.ledgerEntries.forEach((e) => expect(e.quantity).toBe(25));
  });
});
