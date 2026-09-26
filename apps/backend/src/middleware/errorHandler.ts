import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Typed application error.
 * `code` maps to error codes defined in §20 of the API contract.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Map of well-known error codes (§20 of API contract) */
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_REVOKED: "TOKEN_REVOKED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // Resources
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  // Business logic
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  STOCK_CONSTRAINT_VIOLATION: "STOCK_CONSTRAINT_VIOLATION",
  OPERATION_BLOCKED: "OPERATION_BLOCKED",
  IDEMPOTENCY_KEY_CONFLICT: "IDEMPOTENCY_KEY_CONFLICT",
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  AUTH_RATE_LIMIT_EXCEEDED: "AUTH_RATE_LIMIT_EXCEEDED",
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Centralized error handler — always returns JSON */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Request validation failed.",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // ── Known operational errors ──────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
    return;
  }

  // ── Unknown / programmer errors ────────────────────────────────────────────
  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "An unexpected error occurred.",
  });
}
