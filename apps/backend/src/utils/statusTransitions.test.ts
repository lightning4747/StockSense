/**
 * Unit tests — Status Transition Logic
 *
 * Tests the valid/invalid transitions for Receipt, Delivery, and Transfer
 * without touching the database.
 */
import { describe, it, expect } from "vitest";

// ── Pure transition validators ────────────────────────────────────────────────

type ReceiptStatus  = "DRAFT" | "READY" | "DONE" | "CANCELED";
type DeliveryStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
type TransferStatus = "DRAFT" | "READY" | "DONE" | "CANCELED";

function canTransitionReceipt(from: ReceiptStatus, to: ReceiptStatus): boolean {
  const allowed: Record<ReceiptStatus, ReceiptStatus[]> = {
    DRAFT:    ["READY", "CANCELED"],
    READY:    ["DONE",  "CANCELED"],
    DONE:     [],
    CANCELED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  const allowed: Record<DeliveryStatus, DeliveryStatus[]> = {
    DRAFT:    ["READY", "WAITING", "CANCELED"],
    WAITING:  ["READY", "CANCELED"],
    READY:    ["DONE",  "CANCELED"],
    DONE:     [],
    CANCELED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

function canTransitionTransfer(from: TransferStatus, to: TransferStatus): boolean {
  const allowed: Record<TransferStatus, TransferStatus[]> = {
    DRAFT:    ["READY", "CANCELED"],
    READY:    ["DONE",  "CANCELED"],
    DONE:     [],
    CANCELED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

function isTerminal(status: ReceiptStatus | DeliveryStatus | TransferStatus): boolean {
  return status === "DONE" || status === "CANCELED";
}

// ── Receipt transitions ───────────────────────────────────────────────────────

describe("Receipt status transitions", () => {
  it("DRAFT → READY is valid", () => {
    expect(canTransitionReceipt("DRAFT", "READY")).toBe(true);
  });

  it("DRAFT → CANCELED is valid", () => {
    expect(canTransitionReceipt("DRAFT", "CANCELED")).toBe(true);
  });

  it("READY → DONE is valid", () => {
    expect(canTransitionReceipt("READY", "DONE")).toBe(true);
  });

  it("READY → CANCELED is valid", () => {
    expect(canTransitionReceipt("READY", "CANCELED")).toBe(true);
  });

  it("DRAFT → DONE is invalid (must go through READY)", () => {
    expect(canTransitionReceipt("DRAFT", "DONE")).toBe(false);
  });

  it("DONE → anything is invalid", () => {
    expect(canTransitionReceipt("DONE", "CANCELED")).toBe(false);
    expect(canTransitionReceipt("DONE", "DRAFT")).toBe(false);
    expect(canTransitionReceipt("DONE", "READY")).toBe(false);
  });

  it("CANCELED → anything is invalid", () => {
    expect(canTransitionReceipt("CANCELED", "DRAFT")).toBe(false);
    expect(canTransitionReceipt("CANCELED", "READY")).toBe(false);
    expect(canTransitionReceipt("CANCELED", "DONE")).toBe(false);
  });

  it("DONE and CANCELED are terminal states", () => {
    expect(isTerminal("DONE")).toBe(true);
    expect(isTerminal("CANCELED")).toBe(true);
    expect(isTerminal("DRAFT")).toBe(false);
    expect(isTerminal("READY")).toBe(false);
  });
});

// ── Delivery transitions ──────────────────────────────────────────────────────

describe("Delivery status transitions", () => {
  it("DRAFT → READY is valid (sufficient stock)", () => {
    expect(canTransitionDelivery("DRAFT", "READY")).toBe(true);
  });

  it("DRAFT → WAITING is valid (insufficient stock)", () => {
    expect(canTransitionDelivery("DRAFT", "WAITING")).toBe(true);
  });

  it("WAITING → READY is valid", () => {
    expect(canTransitionDelivery("WAITING", "READY")).toBe(true);
  });

  it("READY → DONE is valid", () => {
    expect(canTransitionDelivery("READY", "DONE")).toBe(true);
  });

  it("DRAFT → DONE is invalid", () => {
    expect(canTransitionDelivery("DRAFT", "DONE")).toBe(false);
  });

  it("WAITING → DONE is invalid (must go through READY)", () => {
    expect(canTransitionDelivery("WAITING", "DONE")).toBe(false);
  });

  it("DONE → anything is invalid", () => {
    expect(canTransitionDelivery("DONE", "CANCELED")).toBe(false);
    expect(canTransitionDelivery("DONE", "READY")).toBe(false);
  });

  it("cancel is allowed from DRAFT, WAITING, READY", () => {
    expect(canTransitionDelivery("DRAFT",   "CANCELED")).toBe(true);
    expect(canTransitionDelivery("WAITING", "CANCELED")).toBe(true);
    expect(canTransitionDelivery("READY",   "CANCELED")).toBe(true);
  });

  it("cannot cancel a DONE delivery", () => {
    expect(canTransitionDelivery("DONE", "CANCELED")).toBe(false);
  });
});

// ── Transfer transitions ──────────────────────────────────────────────────────

describe("Transfer status transitions", () => {
  it("DRAFT → READY is valid", () => {
    expect(canTransitionTransfer("DRAFT", "READY")).toBe(true);
  });

  it("READY → DONE is valid", () => {
    expect(canTransitionTransfer("READY", "DONE")).toBe(true);
  });

  it("DRAFT → DONE is invalid", () => {
    expect(canTransitionTransfer("DRAFT", "DONE")).toBe(false);
  });

  it("DONE → anything is invalid", () => {
    expect(canTransitionTransfer("DONE", "CANCELED")).toBe(false);
    expect(canTransitionTransfer("DONE", "READY")).toBe(false);
  });

  it("cancel is allowed from DRAFT and READY", () => {
    expect(canTransitionTransfer("DRAFT", "CANCELED")).toBe(true);
    expect(canTransitionTransfer("READY", "CANCELED")).toBe(true);
  });

  it("cannot cancel a DONE transfer", () => {
    expect(canTransitionTransfer("DONE", "CANCELED")).toBe(false);
  });
});
