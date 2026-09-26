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
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * All error codes from §20 of the API contract, plus internal codes
 * needed by auth middleware and rate limiter.
 */
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_REVOKED: "TOKEN_REVOKED",
  // OTP / password reset
  INVALID_OTP: "INVALID_OTP",
  OTP_EXPIRED: "OTP_EXPIRED",
  // Resources
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  // Business logic — inventory
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  NEGATIVE_STOCK: "NEGATIVE_STOCK",
  LOCATION_MISMATCH: "LOCATION_MISMATCH",
  OPERATION_BLOCKED: "OPERATION_BLOCKED",
  // Specific not-found codes
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  WAREHOUSE_NOT_FOUND: "WAREHOUSE_NOT_FOUND",
  RECEIPT_NOT_FOUND: "RECEIPT_NOT_FOUND",
  DELIVERY_NOT_FOUND: "DELIVERY_NOT_FOUND",
  TRANSFER_NOT_FOUND: "TRANSFER_NOT_FOUND",
  // Idempotency
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  // Rate limiting (internal)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  AUTH_RATE_LIMIT_EXCEEDED: "AUTH_RATE_LIMIT_EXCEEDED",
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Centralized error handler.
 *
 * Response shape follows §1 of the API contract:
 * {
 *   "error": {
 *     "code": "...",
 *     "message": "...",
 *     "details": {}   // optional
 *   }
 * }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Request validation failed.",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // ── Known operational errors ──────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    const body: Record<string, unknown> = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown / programmer errors ───────────────────────────────────────────
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "An unexpected error occurred.",
    },
  });
}
