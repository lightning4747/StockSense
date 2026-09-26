/**
 * Unit tests — OTP hash / verify
 *
 * Tests the OTP generation rules and the sha256 reset token hashing
 * used in auth.service without requiring Argon2id (slow) or a real DB.
 */
import { describe, it, expect } from "vitest";
import crypto from "crypto";

// ── Pure OTP helpers (extracted from auth.service logic) ─────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function verifyResetToken(rawToken: string, storedHash: string): boolean {
  const computed = crypto.createHash("sha256").update(rawToken).digest("hex");
  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}

function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

function isOtpValid(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("OTP generation", () => {
  it("generates a 6-digit numeric string", () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it("is always between 100000 and 999999", () => {
    for (let i = 0; i < 20; i++) {
      const otp = parseInt(generateOtp(), 10);
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    }
  });

  it("generates different values on repeated calls", () => {
    const otps = new Set(Array.from({ length: 50 }, generateOtp));
    // With 50 samples from 900000 possibilities, we expect >1 unique value
    expect(otps.size).toBeGreaterThan(1);
  });
});

describe("OTP format validation", () => {
  it("accepts valid 6-digit OTP", () => {
    expect(isOtpValid("123456")).toBe(true);
    expect(isOtpValid("000000")).toBe(true);
    expect(isOtpValid("999999")).toBe(true);
  });

  it("rejects OTPs that are too short or too long", () => {
    expect(isOtpValid("12345")).toBe(false);
    expect(isOtpValid("1234567")).toBe(false);
  });

  it("rejects non-numeric OTPs", () => {
    expect(isOtpValid("abcdef")).toBe(false);
    expect(isOtpValid("12345a")).toBe(false);
    expect(isOtpValid("12 456")).toBe(false);
  });
});

describe("OTP expiry", () => {
  it("returns false for a future expiry", () => {
    const future = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
    expect(isOtpExpired(future)).toBe(false);
  });

  it("returns true for a past expiry", () => {
    const past = new Date(Date.now() - 1000); // 1 second ago
    expect(isOtpExpired(past)).toBe(true);
  });
});

describe("Reset token hashing", () => {
  it("produces a 64-char hex sha256 hash", () => {
    const token = crypto.randomUUID();
    const hashed = hashResetToken(token);
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]+$/);
  });

  it("same token always produces same hash (deterministic)", () => {
    const token = "fixed-test-token";
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it("different tokens produce different hashes", () => {
    const a = hashResetToken("token-a");
    const b = hashResetToken("token-b");
    expect(a).not.toBe(b);
  });

  it("verifies a token against its stored hash", () => {
    const rawToken = crypto.randomUUID();
    const storedHash = hashResetToken(rawToken);
    expect(verifyResetToken(rawToken, storedHash)).toBe(true);
  });

  it("rejects a wrong token against a stored hash", () => {
    const storedHash = hashResetToken("correct-token");
    expect(verifyResetToken("wrong-token", storedHash)).toBe(false);
  });
});
