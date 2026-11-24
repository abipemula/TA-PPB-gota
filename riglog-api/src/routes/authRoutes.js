import express from "express";
import {
  createAdminToken,
  verifyAdminToken,
  verifyPassword,
} from "../middleware/adminAuth.js";

const router = express.Router();

// POST /api/auth/login — Verifikasi password admin
router.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Password admin wajib diisi." });
  }
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: "Password admin salah." });
  }
  const token = createAdminToken();
  return res.json({
    success: true,
    role: "admin",
    token,
    message: "Berhasil masuk sebagai Admin Gudang.",
  });
});

// GET /api/auth/verify — Cek apakah token sesi admin masih aktif
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const valid = verifyAdminToken(token);
  return res.json({ valid, role: valid ? "admin" : "guest" });
});

export default router;
