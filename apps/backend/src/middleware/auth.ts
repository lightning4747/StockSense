import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError, ERROR_CODES } from "./errorHandler";
import { db } from "../db";
import { revokedTokens } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthPayload extends JwtPayload {
  sub: string;   // user id (uuid)
  jti: string;   // unique token id
  loginId: string;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * requireAuth middleware — verifies JWT and attaches payload to req.user.
 * Checks revoked_tokens table for logged-out tokens.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication required.", 401, ERROR_CODES.UNAUTHORIZED)
    );
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
    }) as AuthPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token has expired.", 401, ERROR_CODES.TOKEN_EXPIRED));
    }
    return next(new AppError("Invalid token.", 401, ERROR_CODES.TOKEN_INVALID));
  }

  // Check blocklist
  const revoked = await db
    .select()
    .from(revokedTokens)
    .where(eq(revokedTokens.jti, payload.jti))
    .limit(1);

  if (revoked.length > 0) {
    return next(new AppError("Token has been revoked.", 401, ERROR_CODES.TOKEN_REVOKED));
  }

  req.user = payload;
  next();
}
