import { Request, Response, NextFunction } from "express";
import type { AuthPayload } from "./auth";

/**
 * Audit middleware — automatically injects `createdBy` / `updatedBy`
 * from the authenticated user into POST and PATCH request bodies.
 *
 * Apply AFTER requireAuth so req.user is already populated.
 *
 * Note: The Drizzle service layer also sets these fields explicitly;
 * this middleware provides a safety net for any handler that forgets to.
 */
export function auditFields(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next();

  const payload = req.user as AuthPayload;

  if (req.method === "POST" || req.method === "PATCH") {
    if (req.body && typeof req.body === "object") {
      if (req.method === "POST") {
        req.body.__createdBy = payload.sub;
      }
      req.body.__updatedBy = payload.sub;
    }
  }

  next();
}
