import express from "express";
import { SupplierController } from "../controllers/supplierController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", SupplierController.getAll);
router.get("/:id", SupplierController.getById);
router.post("/", requireAdmin, SupplierController.create);
router.put("/:id", requireAdmin, SupplierController.update);
router.delete("/:id", requireAdmin, SupplierController.remove);

export default router;
