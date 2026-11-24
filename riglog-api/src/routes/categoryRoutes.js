import express from "express";
import { CategoryController } from "../controllers/categoryController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/", requireAdmin, CategoryController.create);
router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.put("/:id", requireAdmin, CategoryController.update);
router.delete("/:id", requireAdmin, CategoryController.remove);

export default router;
