import express from "express";
import { StockLogController } from "../controllers/stockLogController.js";

const router = express.Router();

router.get("/", StockLogController.getAll);
router.get("/:id", StockLogController.getById);
router.post("/", StockLogController.create);
router.delete("/:id", StockLogController.remove);

export default router;
