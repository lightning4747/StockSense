import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ERROR_CODES } from "../../middleware/errorHandler";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

const updateProfileSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

// GET /profile
router.get("/",
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const [user] = await db
      .select({ id: users.id, loginId: users.loginId, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
    res.json({ data: user });
  })
);

// PATCH /profile — email only; loginId and password cannot change here
router.patch("/",
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const { email } = req.body as { email: string };

    // Unique email check
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (conflict && conflict.id !== payload.sub) {
      throw new AppError("Email is already in use.", 409, ERROR_CODES.CONFLICT);
    }

    const [updated] = await db
      .update(users)
      .set({ email, updatedAt: new Date(), updatedBy: payload.sub })
      .where(eq(users.id, payload.sub))
      .returning({ id: users.id, loginId: users.loginId, email: users.email });

    res.json({ data: updated, message: "Profile updated successfully" });
  })
);

export default router;
