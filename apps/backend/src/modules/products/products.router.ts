import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductSchema, updateProductSchema,
  productIdParamSchema, productQuerySchema,
} from "./products.schemas";
import * as ProductService from "./products.service";
import type { AuthPayload } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/",
  validate({ query: productQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await ProductService.listProducts(req.query as any);
    res.json(result);
  })
);

router.post("/",
  validate({ body: createProductSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ProductService.createProduct(req.body, payload.sub);
    res.status(201).json({ data, message: "Product created successfully" });
  })
);

router.get("/:productId",
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await ProductService.getProduct(req.params["productId"]!);
    res.json({ data });
  })
);

router.patch("/:productId",
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    const data = await ProductService.updateProduct(req.params["productId"]!, req.body, payload.sub);
    res.json({ data, message: "Product updated successfully" });
  })
);

router.delete("/:productId",
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.user as AuthPayload;
    await ProductService.deleteProduct(req.params["productId"]!, payload.sub);
    res.json({ data: null, message: "Product deactivated successfully" });
  })
);

export default router;
