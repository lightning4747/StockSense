/**
 * Unit tests — Stock Invariants
 *
 * Verifies the business rules that must hold at the application layer,
 * independent of the DB CHECK constraints.
 */
import { describe, it, expect } from "vitest";

// ── Pure helper functions that mirror application-level invariant checks ─────

function computeFreeToUse(onHand: number, reserved: number): number {
  return onHand - reserved;
}

function canFulfil(onHand: number, reserved: number, requested: number): boolean {
  return computeFreeToUse(onHand, reserved) >= requested;
}

function applyReceipt(currentOnHand: number, quantity: number): number {
  return currentOnHand + quantity;
}

function applyDelivery(currentOnHand: number, quantity: number): number {
  const result = currentOnHand - quantity;
  if (result < 0) throw new Error("NEGATIVE_STOCK");
  return result;
}

function applyAdjustment(currentOnHand: number, countedQuantity: number) {
  if (countedQuantity < 0) throw new Error("STOCK_CONSTRAINT_VIOLATION");
  return {
    newOnHand:  countedQuantity,
    difference: countedQuantity - currentOnHand,
  };
}

function applyTransfer(
  sourceOnHand: number,
  destOnHand: number,
  quantity: number
): { source: number; dest: number } {
  const newSource = sourceOnHand - quantity;
  if (newSource < 0) throw new Error("NEGATIVE_STOCK");
  return { source: newSource, dest: destOnHand + quantity };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("freeToUse calculation", () => {
  it("equals onHand minus reserved", () => {
    expect(computeFreeToUse(100, 20)).toBe(80);
    expect(computeFreeToUse(50, 0)).toBe(50);
    expect(computeFreeToUse(10, 10)).toBe(0);
  });

  it("returns zero when all stock is reserved", () => {
    expect(computeFreeToUse(30, 30)).toBe(0);
  });
});

describe("fulfilment check", () => {
  it("allows fulfilment when freeToUse >= requested", () => {
    expect(canFulfil(100, 20, 80)).toBe(true);
    expect(canFulfil(100, 20, 1)).toBe(true);
  });

  it("rejects fulfilment when freeToUse < requested", () => {
    expect(canFulfil(100, 20, 81)).toBe(false);
    expect(canFulfil(10, 5, 10)).toBe(false);
  });

  it("rejects when all stock is reserved", () => {
    expect(canFulfil(50, 50, 1)).toBe(false);
  });
});

describe("receipt — on_hand increases", () => {
  it("adds received quantity to on_hand", () => {
    expect(applyReceipt(0, 50)).toBe(50);
    expect(applyReceipt(100, 25)).toBe(125);
  });

  it("handles zero initial stock", () => {
    expect(applyReceipt(0, 1)).toBe(1);
  });
});

describe("delivery — on_hand decreases", () => {
  it("subtracts delivered quantity from on_hand", () => {
    expect(applyDelivery(100, 40)).toBe(60);
    expect(applyDelivery(50, 50)).toBe(0);
  });

  it("throws NEGATIVE_STOCK when quantity exceeds on_hand", () => {
    expect(() => applyDelivery(10, 11)).toThrow("NEGATIVE_STOCK");
    expect(() => applyDelivery(0, 1)).toThrow("NEGATIVE_STOCK");
  });
});

describe("adjustment", () => {
  it("returns countedQuantity as new on_hand", () => {
    const { newOnHand, difference } = applyAdjustment(50, 47);
    expect(newOnHand).toBe(47);
    expect(difference).toBe(-3);
  });

  it("handles positive difference", () => {
    const { newOnHand, difference } = applyAdjustment(10, 15);
    expect(newOnHand).toBe(15);
    expect(difference).toBe(5);
  });

  it("handles zero adjustment (no change)", () => {
    const { newOnHand, difference } = applyAdjustment(20, 20);
    expect(newOnHand).toBe(20);
    expect(difference).toBe(0);
  });

  it("throws when counted quantity is negative", () => {
    expect(() => applyAdjustment(20, -1)).toThrow("STOCK_CONSTRAINT_VIOLATION");
  });
});

describe("internal transfer", () => {
  it("moves stock from source to destination", () => {
    const { source, dest } = applyTransfer(100, 20, 30);
    expect(source).toBe(70);
    expect(dest).toBe(50);
  });

  it("allows full transfer of source stock", () => {
    const { source, dest } = applyTransfer(50, 0, 50);
    expect(source).toBe(0);
    expect(dest).toBe(50);
  });

  it("throws NEGATIVE_STOCK when source has insufficient stock", () => {
    expect(() => applyTransfer(10, 0, 11)).toThrow("NEGATIVE_STOCK");
    expect(() => applyTransfer(0, 50, 1)).toThrow("NEGATIVE_STOCK");
  });

  it("destination increases by exact transfer quantity", () => {
    const { dest } = applyTransfer(100, 0, 40);
    expect(dest).toBe(40);
  });
});

describe("on_hand >= 0 invariant", () => {
  it("receipt always produces non-negative on_hand", () => {
    expect(applyReceipt(0, 0)).toBeGreaterThanOrEqual(0);
    expect(applyReceipt(100, 50)).toBeGreaterThanOrEqual(0);
  });

  it("delivery at exact on_hand results in zero (not negative)", () => {
    expect(applyDelivery(50, 50)).toBe(0);
  });
});
