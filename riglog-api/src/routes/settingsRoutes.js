import express from "express";
import { SettingsController } from "../controllers/settingsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Publik boleh membaca profil toko & logo brand
router.get("/", SettingsController.getAll);
// Hanya Admin yang bisa mengubah profil admin & logo brand
router.put("/", requireAdmin, SettingsController.update);

export default router;
