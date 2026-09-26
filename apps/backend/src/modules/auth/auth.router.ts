import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  passwordResetSchema,
} from "./auth.schemas";
import * as AuthService from "./auth.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();

// Apply auth rate limiter to every route in this file
router.use(authRateLimiter);

// ---------------------------------------------------------------------------
// POST /auth/signup
// ---------------------------------------------------------------------------
router.post(
  "/signup",
  validate({ body: signupSchema }),
  asyncHandler(async (req, res) => {
    const result = await AuthService.signup(req.body);
    res.status(201).json({
      data: result,
      message: "Account created successfully",
    });
  })
);

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    res.status(200).json({
      data: result,
      message: "Login successful",
    });
  })
);

// ---------------------------------------------------------------------------
// POST /auth/logout  (requires valid JWT)
// ---------------------------------------------------------------------------
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;

    // exp is seconds-since-epoch per JWT spec
    const expiresAt = payload.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + 15 * 60 * 1000); // fallback: 15 min from now

    await AuthService.logout(payload.jti, expiresAt);

    res.status(200).json({
      data: null,
      message: "Logged out successfully",
    });
  })
);

// ---------------------------------------------------------------------------
// GET /auth/me  (requires valid JWT)
// ---------------------------------------------------------------------------
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const user = await AuthService.getMe(payload.sub);
    res.status(200).json({ data: user });
  })
);

// ---------------------------------------------------------------------------
// POST /auth/password-reset/request
// ---------------------------------------------------------------------------
router.post(
  "/password-reset/request",
  validate({ body: passwordResetRequestSchema }),
  asyncHandler(async (req, res) => {
    // Always returns same response — never reveals email existence
    await AuthService.passwordResetRequest(req.body);
    res.status(200).json({
      data: { message: "If the account exists, an OTP has been sent." },
    });
  })
);

// ---------------------------------------------------------------------------
// POST /auth/password-reset/verify
// ---------------------------------------------------------------------------
router.post(
  "/password-reset/verify",
  validate({ body: passwordResetVerifySchema }),
  asyncHandler(async (req, res) => {
    const result = await AuthService.passwordResetVerify(req.body);
    res.status(200).json({ data: result });
  })
);

// ---------------------------------------------------------------------------
// POST /auth/password-reset
// ---------------------------------------------------------------------------
router.post(
  "/password-reset",
  validate({ body: passwordResetSchema }),
  asyncHandler(async (req, res) => {
    await AuthService.passwordReset(req.body);
    res.status(200).json({
      data: null,
      message: "Password updated successfully",
    });
  })
);

export default router;
