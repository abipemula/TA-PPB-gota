# Panduan Revisi Asistensi & Alur Kode — RigLog (PPB 2026)

Dokumen ini merangkum **seluruh perbaikan revisi asistensi** dan **peta alur kode** supaya kamu bisa menjawab pertanyaan Asprak dengan percaya diri saat demo & responsi.

---

## 1. Status Perbaikan Revisi Asistensi

| Poin Revisi / Saran Asprak | Solusi yang Sudah Diterapkan | File Terkait |
| :--- | :--- | :--- |
| **1. Bug PWA tidak bisa di-download + tombol install di pojok kanan bawah** | - Ikon manifest diperbaiki menjadi **PNG persegi asli** (`192x192` & `512x512`) sesuai syarat wajib instalasi Chrome PWA.<br>- Ditambahkan tombol merah mengambang **"Install App"** permanen di pojok kanan bawah (di atas BottomNav). Jika browser mendukung `beforeinstallprompt`, langsung membuka dialog install; jika tidak, menampilkan panduan 1-klik. | [vite.config.js](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/vite.config.js), [PWABadge.jsx](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/components/PWABadge.jsx), `public/icon-192.png`, `public/icon-512.png` |
| **2. Database nyangkut / tidak sinkron antara kode & app** | - Menghapus *bypass* `localStorage` saat server online dan menambahkan header `Cache-Control: no-store` di backend + `NetworkOnly` untuk `/api/` di Service Worker Workbox.<br>- Frontend sekarang **selalu membaca data live terbaru** dari Express API. | [api.js](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/config/api.js), [hardwareService.js](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/services/hardwareService.js), [index.js](file:///d:/TA%20PPB%20SEM%205/riglog-api/src/index.js) |
| **3. Navigasi Katalog–Profil dipusatkan di bawah saja** | - Menu navigasi teks di header atas dihapus.<br>- Seluruh 5 tab navigasi utama (**Katalog**, **Stok Log**, **Watchlist**, **Gudang**, **Profil/About**) kini eksklusif di **Bottom Navigation Bar**. | [Header.jsx](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/components/Header.jsx), [BottomNav.jsx](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/components/BottomNav.jsx) |
| **4. Tambah komponen tidak masuk log & bingung alur kodenya** | - Setiap kali komponen baru ditambahkan (`POST /api/products`) atau stoknya diubah lewat Edit (`PUT /api/products/:id`), backend **otomatis membuat catatan di tabel `stock_logs`** sehingga langsung tampil di halaman **Stok Log**!<br>- Lihat peta alur kode di Bagian 2 di bawah. | [productModel.js](file:///d:/TA%20PPB%20SEM%205/riglog-api/src/models/productModel.js) |
| **5. Proteksi Password Admin untuk edit profil & data** | - Pengunjung umum hanya bisa melihat Katalog, Detail, Stok Log, Gudang, Watchlist pribadi, dan Profil/About (read-only).<br>- Hanya **Admin** yang login dengan password (`POST /api/auth/login`) yang bisa edit profil, upload logo brand, tambah/edit/hapus komponen, dan catat mutasi stok.<br>- **Password Admin Default:** `riglog2026` (bisa diubah lewat `ADMIN_PASSWORD` di `.env` `riglog-api`). | [adminAuth.js](file:///d:/TA%20PPB%20SEM%205/riglog-api/src/middleware/adminAuth.js), [authRoutes.js](file:///d:/TA%20PPB%20SEM%205/riglog-api/src/routes/authRoutes.js), [ProfilePage.jsx](file:///d:/TA%20PPB%20SEM%205/riglog-pwa/src/pages/ProfilePage.jsx) |
| **6. Frontend wajib panggil Express API sendiri -> Backend ke PostgreSQL (Neon/Supabase)** | - **0 pemanggilan langsung ke `/rest/v1/` Supabase** di frontend.<br>- Backend Express (`riglog-api`) kini mendukung **PostgreSQL Neon/Supabase (`DATABASE_URL`)** dengan inisialisasi tabel & seed otomatis saat startup! | [db.js](file:///d:/TA%20PPB%20SEM%205/riglog-api/src/config/db.js), [riglog-api/.env.example](file:///d:/TA%20PPB%20SEM%205/riglog-api/.env.example) |

---

## 2. Peta Alur Kode "Tambah Komponen" (Supaya Paham Saat Ditanya Asprak)

Jika Asprak bertanya **"Saat tombol Simpan Komponen diklik, kodenya lewat mana saja?"**, ini urutan persisnya:

1. **Form Frontend:** `riglog-pwa/src/pages/CreateHardwarePage.jsx` → fungsi `handleSubmit()`
2. **Service Frontend:** `riglog-pwa/src/services/hardwareService.js` → `createProduct(payload)` mengirim `POST http://localhost:3000/api/products` (membawa `Authorization: Bearer <token_admin>` dari `src/config/api.js`)
3. **Router Backend:** `riglog-api/src/routes/productRoutes.js` → `router.post("/", requireAdmin, ProductController.create)`
4. **Middleware Auth:** `riglog-api/src/middleware/adminAuth.js` → memverifikasi token Admin
5. **Controller Backend:** `riglog-api/src/controllers/productController.js` → `ProductController.create(req, res)`
6. **Model & Database:** `riglog-api/src/models/productModel.js` → `ProductModel.create(payload)` menyimpan ke tabel **`products`** (PostgreSQL Neon/Supabase atau `local-db.json` saat dev) **DAN** otomatis memanggil `insertAutoStockLog(...)` untuk mencatat stok awalnya ke tabel **`stock_logs`**!

---

## 3. Cara Pindah ke Database PostgreSQL Cloud (Neon atau Supabase) Besok

1. Buat database gratis di **Neon (https://neon.tech)** atau **Supabase (https://supabase.com)**.
2. Salin **PostgreSQL Connection String** (diawali `postgresql://...`).
3. Tempel ke file `riglog-api/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
   ADMIN_PASSWORD=riglog2026
   PORT=3000
   ```
4. Jalankan ulang `riglog-api` (`npm run dev` atau deploy ke Vercel dengan Environment Variable `DATABASE_URL` & `ADMIN_PASSWORD`).
5. **Tabel (`categories`, `suppliers`, `products`, `stock_logs`, `app_settings`) dan data awal otomatis dibuat oleh `riglog-api/src/config/db.js`!**
