import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { globalSearch } from "./search.service";

const router = Router();
router.use(requireAuth);

const searchQuerySchema = z.object({
  q:     z.string().min(1, "Search query is required").max(200),
  type:  z.enum(["product", "receipt", "delivery", "transfer", "move"]).optional(),
  limit: z.string().optional().default("20").transform(Number),
});

// GET /search
router.get("/",
  validate({ query: searchQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, type, limit } = req.query as unknown as {
      q: string; type?: "product" | "receipt" | "delivery" | "transfer" | "move"; limit: number;
    };
    const data = await globalSearch(q, type, limit);
    res.json({ data });
  })
);

export default router;
