import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import stockLogRoutes from "./routes/stockLogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { requireAdmin } from "./middleware/adminAuth.js";
import { isPostgresConfigured, ensurePostgresReady } from "./config/db.js";
import { isSupabaseConfigured } from "./config/supabaseClient.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Mencegah browser/PWA cache data API yang basi (fix bug database tidak sinkron)
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Layani file gambar komponen yang tersimpan di disk lokal
app.use("/uploads", express.static(UPLOADS_DIR));

// Endpoint upload gambar (memerlukan akses Admin)
app.post("/api/upload", requireAdmin, (req, res) => {
  try {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "Field dataUrl wajib diisi." });
    }

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Format gambar base64 tidak valid." });
    }

    // Jika sedang deploy di cloud serverless (Vercel / Supabase / PostgreSQL), kembalikan dataUrl langsung
    // agar gambar tersimpan utuh di kolom database tanpa bergantung pada filesystem sementara
    if (process.env.VERCEL || isPostgresConfigured || isSupabaseConfigured) {
      return res.status(201).json({
        success: true,
        data: { url: dataUrl, filename: filename || "image" },
      });
    }

    const ext = match[1]
      .toLowerCase()
      .replace("jpeg", "jpg")
      .replace("svg+xml", "svg");
    const safeBase = (filename || "hw")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 32);
    const savedName = `${safeBase}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(match[2], "base64");

    fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buffer);

    const protocol = req.protocol || "http";
    const host = req.get("host") || `localhost:${process.env.PORT || 3000}`;
    const publicUrl = `${protocol}://${host}/uploads/${savedName}`;

    return res.status(201).json({
      success: true,
      data: { url: publicUrl, filename: savedName },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Gagal menyimpan gambar." });
  }
});

const getDbMode = () => {
  if (isPostgresConfigured) return "PostgreSQL Cloud (Neon / Supabase DATABASE_URL)";
  if (isSupabaseConfigured) return "Supabase PostgreSQL (REST Client)";
  return "Local Dev JSON (data/local-db.json — sementara untuk testing lokal)";
};

// Endpoint status kesehatan API
app.get("/", (req, res) => {
  res.json({
    app: "RigLog API - Sistem Inventaris Gudang & Toko Komponen Komputer",
    version: "1.1.0",
    database: getDbMode(),
    endpoints: [
      "/api/auth/login",
      "/api/auth/verify",
      "/api/settings",
      "/api/categories",
      "/api/products",
      "/api/suppliers",
      "/api/stock-logs",
      "/api/upload",
    ],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", supplierRoutes);
app.use("/api/stock-logs", stockLogRoutes);

if (isPostgresConfigured) {
  ensurePostgresReady()
    .then(() => console.log("[RigLog API] Skema PostgreSQL siap."))
    .catch((err) =>
      console.error("[RigLog API] Gagal inisialisasi PostgreSQL:", err.message)
    );
}

const port = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[RigLog API] Server running on http://localhost:${port}`);
    console.log(`[RigLog API] Database Mode: ${getDbMode()}`);
  });
}

export default app;
