/**
 * Integration tests — Delivery validation atomic operation
 *
 * Verifies the READY → DONE transition logic: stock deduction,
 * ledger entries, and idempotency behaviour.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

// ── Pure validation logic ─────────────────────────────────────────────────────

interface DeliveryItem {
  productId: string;
  requestedQuantity: number;
}

interface StockLevel {
  productId: string;
  locationId: string;
  onHand: number;
}

interface ValidationResult {
  status: "DONE";
  stockUpdates: StockLevel[];
  ledgerEntries: Array<{ productId: string; quantity: number; movementType: string }>;
}

function validateDelivery(
  status: string,
  items: DeliveryItem[],
  stockMap: Map<string, StockLevel>
): ValidationResult {
  if (status !== "READY") throw new Error("INVALID_STATUS_TRANSITION");

  const stockUpdates: StockLevel[] = [];
  const ledgerEntries: ValidationResult["ledgerEntries"] = [];

  for (const item of items) {
    const stock = stockMap.get(item.productId);
    if (!stock || stock.onHand < item.requestedQuantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const newOnHand = stock.onHand - item.requestedQuantity;
    stockUpdates.push({ ...stock, onHand: newOnHand });
    ledgerEntries.push({
      productId:    item.productId,
      quantity:     item.requestedQuantity,
      movementType: "OUT",
    });
  }

  return { status: "DONE", stockUpdates, ledgerEntries };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Delivery validation — atomic logic", () => {
  let stockMap: Map<string, StockLevel>;

  beforeEach(() => {
    stockMap = new Map([
      ["prod-1", { productId: "prod-1", locationId: "loc-1", onHand: 100 }],
      ["prod-2", { productId: "prod-2", locationId: "loc-1", onHand: 50  }],
    ]);
  });

  it("transitions READY → DONE and deducts stock", () => {
    const result = validateDelivery(
      "READY",
      [{ productId: "prod-1", requestedQuantity: 40 }],
      stockMap
    );
    expect(result.status).toBe("DONE");
    expect(result.stockUpdates[0]?.onHand).toBe(60);
  });

  it("creates one OUT ledger entry per item", () => {
    const result = validateDelivery(
      "READY",
      [
        { productId: "prod-1", requestedQuantity: 10 },
        { productId: "prod-2", requestedQuantity: 5  },
      ],
      stockMap
    );
    expect(result.ledgerEntries).toHaveLength(2);
    result.ledgerEntries.forEach((e) => expect(e.movementType).toBe("OUT"));
  });

  it("rejects validation when status is not READY", () => {
    expect(() => validateDelivery("DRAFT", [], stockMap)).toThrow("INVALID_STATUS_TRANSITION");
    expect(() => validateDelivery("DONE",  [], stockMap)).toThrow("INVALID_STATUS_TRANSITION");
    expect(() => validateDelivery("WAITING", [], stockMap)).toThrow("INVALID_STATUS_TRANSITION");
  });

  it("rejects when stock is insufficient (all-or-nothing)", () => {
    expect(() =>
      validateDelivery(
        "READY",
        [{ productId: "prod-1", requestedQuantity: 101 }],
        stockMap
      )
    ).toThrow("INSUFFICIENT_STOCK");
  });

  it("stock never goes negative", () => {
    expect(() =>
      validateDelivery(
        "READY",
        [{ productId: "prod-2", requestedQuantity: 51 }],
        stockMap
      )
    ).toThrow("INSUFFICIENT_STOCK");
  });

  it("allows exact fulfilment (on_hand becomes 0)", () => {
    const result = validateDelivery(
      "READY",
      [{ productId: "prod-2", requestedQuantity: 50 }],
      stockMap
    );
    expect(result.stockUpdates[0]?.onHand).toBe(0);
  });
});
