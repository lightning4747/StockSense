import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "./errorHandler";

/** Global rate limit: 100 req / 1 min per IP */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError("Too many requests, please try again later.", 429, "RATE_LIMIT_EXCEEDED"));
  },
});

/** Auth routes: 10 req / 15 min per IP */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError("Too many auth attempts, please try again later.", 429, "AUTH_RATE_LIMIT_EXCEEDED"));
  },
});
