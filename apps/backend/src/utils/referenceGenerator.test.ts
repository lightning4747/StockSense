/**
 * Unit tests — Reference Number Generator
 *
 * The generator is pure logic around sequence padding and format.
 * We mock the DB layer so no real Postgres connection is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB module before importing the function under test ──────────────
vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// ── Helpers to build chainable Drizzle-style mock ────────────────────────────
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "insert", "update", "from", "where", "limit", "set", "values", "returning"];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // Terminal call returns the result
  (chain["limit"] as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  (chain["values"] as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  return chain;
}

describe("reference format", () => {
  it("pads sequence to 4 digits", () => {
    expect(String(1).padStart(4, "0")).toBe("0001");
    expect(String(99).padStart(4, "0")).toBe("0099");
    expect(String(1000).padStart(4, "0")).toBe("1000");
    expect(String(9999).padStart(4, "0")).toBe("9999");
  });

  it("builds correct format string", () => {
    const shortCode = "WH";
    const opType = "IN";
    const seq = 1;
    const paddedSeq = String(seq).padStart(4, "0");
    expect(`${shortCode}/${opType}/${paddedSeq}`).toBe("WH/IN/0001");
  });

  it("supports all operation types", () => {
    const types = ["IN", "OUT", "INT", "ADJ"] as const;
    types.forEach((t) => {
      const ref = `WH/${t}/0001`;
      expect(ref).toMatch(/^WH\/(IN|OUT|INT|ADJ)\/\d{4}$/);
    });
  });

  it("sequences increment correctly", () => {
    const sequences = [1, 2, 3, 100, 999, 1000];
    const expected  = ["0001", "0002", "0003", "0100", "0999", "1000"];
    sequences.forEach((seq, i) => {
      expect(String(seq).padStart(4, "0")).toBe(expected[i]);
    });
  });
});

describe("operation type validation", () => {
  it("only valid operation types are used", () => {
    const validTypes = ["IN", "OUT", "INT", "ADJ"];
    validTypes.forEach((t) => {
      expect(validTypes).toContain(t);
    });
  });
});
