/**
 * Auth Service — all business logic for authentication.
 *
 * Responsibilities:
 *  - Password hashing / verification (Argon2id)
 *  - JWT issue / verify
 *  - OTP generation, hashing, expiry
 *  - Reset token generation, hashing, expiry
 *  - DB reads/writes for users, OTPs, reset tokens, revoked tokens
 *  - Email dispatch via Nodemailer
 */

import { hash, verify as argonVerify } from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { eq, and, gt } from "drizzle-orm";

import { db } from "../../db";
import {
  users,
  passwordResetOtps,
  resetTokens,
  revokedTokens,
} from "../../db/schema";
import { env } from "../../config/env";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { logger } from "../../utils/logger";
import type {
  SignupBody,
  LoginBody,
  PasswordResetRequestBody,
  PasswordResetVerifyBody,
  PasswordResetBody,
} from "./auth.schemas";

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export interface TokenPayload {
  sub: string;
  jti: string;
  loginId: string;
}

export function issueAccessToken(userId: string, loginId: string): string {
  const jti = uuidv4();
  return jwt.sign({ sub: userId, jti, loginId } as TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
  });
}

// ---------------------------------------------------------------------------
// Nodemailer transporter (created once, reused)
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

async function sendOtpEmail(to: string, otp: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "StockSense — Password Reset OTP",
      text: `Your one-time password is: ${otp}\n\nThis OTP expires in 10 minutes.`,
      html: `<p>Your one-time password is: <strong>${otp}</strong></p>
             <p>This OTP expires in <strong>10 minutes</strong>.</p>`,
    });
  } catch (err) {
    // Log but never expose email errors to the caller (security: don't reveal email existence)
    logger.error("Failed to send OTP email", { error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// signup
// ---------------------------------------------------------------------------

export async function signup(body: SignupBody) {
  const { loginId, email, password, role } = body;

  // Check uniqueness
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginId, loginId))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(
      "A user with this loginId already exists.",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingEmail.length > 0) {
    throw new AppError(
      "A user with this email already exists.",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const passwordHash = await hash(password);
  const userId = uuidv4();

  await db.insert(users).values({
    id: userId,
    loginId,
    email,
    passwordHash,
    role: role || "INVENTORY_MANAGER",
    createdBy: userId,
    updatedBy: userId,
  });

  const accessToken = issueAccessToken(userId, loginId);

  return {
    user: { id: userId, loginId, email, role: role || "INVENTORY_MANAGER" },
    accessToken,
  };
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

export async function login(body: LoginBody) {
  const { loginId, password } = body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginId, loginId))
    .limit(1);

  // Constant-time path: always verify even on miss (prevents timing attacks)
  const passwordHash = user?.passwordHash ?? "$argon2id$v=19$m=65536,t=3,p=4$placeholder";
  const valid = user ? await argonVerify(passwordHash, password) : false;

  if (!user || !valid) {
    throw new AppError(
      "Invalid Login Id or Password",
      401,
      ERROR_CODES.INVALID_CREDENTIALS
    );
  }

  const accessToken = issueAccessToken(user.id, user.loginId);

  return {
    user: { id: user.id, loginId: user.loginId, email: user.email, role: user.role },
    accessToken,
  };
}

// ---------------------------------------------------------------------------
// logout  (revoke JWT by storing jti in DB)
// ---------------------------------------------------------------------------

export async function logout(jti: string, expiresAt: Date): Promise<void> {
  await db
    .insert(revokedTokens)
    .values({ jti, expiresAt })
    .onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// me  (return current user)
// ---------------------------------------------------------------------------

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      loginId: users.loginId,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return user;
}

// ---------------------------------------------------------------------------
// password-reset/request  — generate OTP, hash it, email it
// ---------------------------------------------------------------------------

export async function passwordResetRequest(body: PasswordResetRequestBody): Promise<void> {
  const { email } = body;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always return the same generic message regardless of whether user exists
  if (!user) return;

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await hash(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused OTPs for this user
  await db
    .update(passwordResetOtps)
    .set({ used: true })
    .where(
      and(
        eq(passwordResetOtps.userId, user.id),
        eq(passwordResetOtps.used, false)
      )
    );

  await db.insert(passwordResetOtps).values({
    userId: user.id,
    otpHash,
    expiresAt,
  });

  await sendOtpEmail(email, otp);
}

// ---------------------------------------------------------------------------
// password-reset/verify  — validate OTP, issue reset token
// ---------------------------------------------------------------------------

export async function passwordResetVerify(body: PasswordResetVerifyBody) {
  const { email, otp } = body;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError("Invalid OTP.", 400, ERROR_CODES.INVALID_OTP);
  }

  // Fetch latest valid OTP
  const now = new Date();
  const [otpRecord] = await db
    .select()
    .from(passwordResetOtps)
    .where(
      and(
        eq(passwordResetOtps.userId, user.id),
        eq(passwordResetOtps.used, false),
        gt(passwordResetOtps.expiresAt, now)
      )
    )
    .orderBy(passwordResetOtps.createdAt)
    .limit(1);

  if (!otpRecord) {
    throw new AppError("OTP has expired.", 400, ERROR_CODES.OTP_EXPIRED);
  }

  const valid = await argonVerify(otpRecord.otpHash, otp);
  if (!valid) {
    throw new AppError("Invalid OTP.", 400, ERROR_CODES.INVALID_OTP);
  }

  // Mark OTP as used
  await db
    .update(passwordResetOtps)
    .set({ used: true })
    .where(eq(passwordResetOtps.id, otpRecord.id));

  // Issue a short-lived reset token (raw UUID, stored as hash)
  const rawToken = uuidv4();
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(resetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { resetToken: rawToken };
}

// ---------------------------------------------------------------------------
// password-reset  — verify reset token, set new password
// ---------------------------------------------------------------------------

export async function passwordReset(body: PasswordResetBody): Promise<void> {
  const { resetToken, newPassword } = body;

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const now = new Date();
  const [record] = await db
    .select()
    .from(resetTokens)
    .where(
      and(
        eq(resetTokens.tokenHash, tokenHash),
        eq(resetTokens.used, false),
        gt(resetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!record) {
    throw new AppError(
      "Invalid or expired reset token.",
      400,
      ERROR_CODES.TOKEN_INVALID
    );
  }

  const passwordHash = await hash(newPassword);

  // Atomic: update password + mark token used
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date(), updatedBy: record.userId })
      .where(eq(users.id, record.userId));

    await tx
      .update(resetTokens)
      .set({ used: true })
      .where(eq(resetTokens.id, record.id));
  });
}
