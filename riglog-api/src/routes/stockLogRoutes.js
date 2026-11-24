import express from "express";
import { StockLogController } from "../controllers/stockLogController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", StockLogController.getAll);
router.get("/:id", StockLogController.getById);
router.post("/", requireAdmin, StockLogController.create);
router.delete("/:id", requireAdmin, StockLogController.remove);

export default router;
