import { z } from 'zod';

export const passwordValidation = z
  .string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const loginIdValidation = z
  .string()
  .min(6, 'Login ID must be at least 6 characters')
  .max(12, 'Login ID cannot exceed 12 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Login ID can only contain letters, numbers, and underscores');

export const loginSchema = z.object({
  loginId: loginIdValidation,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  loginId: loginIdValidation,
  email: z.string().email('Please enter a valid email address'),
  password: passwordValidation,
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetVerifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be digits only'),
});

export type PasswordResetVerifyFormData = z.infer<typeof passwordResetVerifySchema>;

export const passwordResetSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordValidation,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
