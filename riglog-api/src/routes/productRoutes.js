import express from "express";
import { ProductController } from "../controllers/productController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);
router.post("/", requireAdmin, ProductController.create);
router.put("/:id", requireAdmin, ProductController.update);
router.patch("/:id", requireAdmin, ProductController.update);
router.delete("/:id", requireAdmin, ProductController.remove);

export default router;
