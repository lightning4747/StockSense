import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { idempotencyKeys } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError, ERROR_CODES } from "./errorHandler";

/**
 * Idempotency middleware — reads the `Idempotency-Key` request header.
 * If a cached response exists for that key, it is returned immediately.
 * Otherwise the request proceeds and the response is captured and stored.
 *
 * Apply to: POST /receipts/:id/validate, /deliveries/:id/validate,
 *           /transfers/:id/validate, /stock/adjustments
 */
export function idempotency() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.headers["idempotency-key"] as string | undefined;

    if (!key) {
      return next(
        new AppError(
          "Idempotency-Key header is required for this endpoint.",
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // Check existing record
    const existing = await db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      res.setHeader("X-Idempotency-Replayed", "true");
      res.status(200).json(JSON.parse(existing[0].responseBody));
      return;
    }

    // Intercept res.json to store the response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Fire-and-forget: store the response
      db.insert(idempotencyKeys)
        .values({ key, responseBody: JSON.stringify(body) })
        .onConflictDoNothing()
        .catch((err) => console.error("Failed to store idempotency key:", err));

      return originalJson(body);
    };

    next();
  };
}
