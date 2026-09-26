import { z } from "zod";

/** loginId: 6–12 chars (alphanumeric + underscore) */
const loginIdSchema = z
  .string()
  .min(6, "loginId must be at least 6 characters")
  .max(12, "loginId must be at most 12 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "loginId may only contain letters, numbers, and underscores");

/**
 * Password rules (§2 of API contract):
 *  - min 9 characters
 *  - at least one lowercase letter
 *  - at least one uppercase letter
 *  - at least one special character
 */
const passwordSchema = z
  .string()
  .min(9, "Password must be at least 9 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  loginId: loginIdSchema,
  email: z.string().email("Must be a valid email address"),
  password: passwordSchema,
});

export type SignupBody = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  loginId: z.string().min(1, "loginId is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginBody = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Password-reset request  (never reveal email existence)
// ---------------------------------------------------------------------------
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export type PasswordResetRequestBody = z.infer<typeof passwordResetRequestSchema>;

// ---------------------------------------------------------------------------
// Password-reset verify OTP
// ---------------------------------------------------------------------------
export const passwordResetVerifySchema = z.object({
  email: z.string().email("Must be a valid email address"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export type PasswordResetVerifyBody = z.infer<typeof passwordResetVerifySchema>;

// ---------------------------------------------------------------------------
// Password-reset set new password
// ---------------------------------------------------------------------------
export const passwordResetSchema = z.object({
  resetToken: z.string().min(1, "resetToken is required"),
  newPassword: passwordSchema,
});

export type PasswordResetBody = z.infer<typeof passwordResetSchema>;
