import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
} from "./categories.schemas";
import * as CategoryService from "./categories.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /categories
router.get(
  "/",
  validate({ query: categoryQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query as unknown as {
      page: number; limit: number; search?: string;
    };
    const result = await CategoryService.listCategories(page, limit, search);
    res.json(result);
  })
);

// POST /categories
router.post(
  "/",
  validate({ body: createCategorySchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await CategoryService.createCategory(req.body, payload.sub);
    res.status(201).json({ data, message: "Category created successfully" });
  })
);

// PATCH /categories/:categoryId
router.patch(
  "/:categoryId",
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await CategoryService.updateCategory(
      req.params["categoryId"]!,
      req.body,
      payload.sub
    );
    res.json({ data, message: "Category updated successfully" });
  })
);

// DELETE /categories/:categoryId
router.delete(
  "/:categoryId",
  validate({ params: categoryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    await CategoryService.deleteCategory(req.params["categoryId"]!, payload.sub);
    res.json({ data: null, message: "Category deleted successfully" });
  })
);

export default router;
