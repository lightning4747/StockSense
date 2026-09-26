import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so unhandled promise rejections are forwarded
 * to Express's centralized error handler instead of crashing the process.
 *
 * Usage:
 *   router.get("/path", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
