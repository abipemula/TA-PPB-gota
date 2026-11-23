# RigLog PWA (Frontend React + Vite PWA - Modul 4 & 5 PPB)

**RigLog : Sistem inventaris terintegrasi untuk pencatatan, pemantauan stok, dan pengelolaan katalog komponen komputer pada toko hardware.**

## Pemenuhan Ketentuan Tugas Akhir Praktikum PPB Ganjil 2026
1. **Menggunakan API (Web Service) yang dibuat sendiri sesuai Modul 1**: Terintegrasi dengan `riglog-api` (`/api/products`, `/api/categories`, `/api/suppliers`, `/api/stock-logs`) maupun Supabase PostgREST + dilengkapi **Local Persistence Fallback (`localStorage`)** agar tetap berjalan offline.
2. **Memiliki Bottom Navigation Bar**: Komponen `src/components/BottomNav.jsx` menyediakan navigasi bawah tetap dengan 5 tab utama.
3. **Memiliki minimal 5 halaman** (Total memiliki **7 Halaman/View**):
   - **Halaman 1 (`CatalogPage.jsx`)**: Katalog & Pemantauan Stok Komponen Komputer (List #1).
   - **Halaman 2 (`StockLogsPage.jsx`)**: Pencatatan & Riwayat Mutasi Stok Gudang Masuk/Keluar (List #2).
   - **Halaman 3 (`FavoritesPage.jsx`)**: Watchlist / Pantauan Komponen Prioritas Restock.
   - **Halaman 4 (`WarehousePage.jsx`)**: Peta Zona Rak Gudang & Direktori Supplier Resmi.
   - **Halaman 5 (`ProfilePage.jsx`)**: Profil Petugas Gudang & Halaman About Aplikasi RigLog.
   - **Halaman 6 & 7 (`CreateHardwarePage.jsx` & `EditHardwarePage.jsx`)**: Form Registrasi & Edit Komponen dengan Auto-Save Draft.
4. **Minimal 2 halaman utama memiliki list yang setiap itemnya dapat diklik untuk menampilkan halaman detail**:
   - Klik item di **Katalog** (atau **Watchlist**) membuka `HardwareDetail.jsx` (spesifikasi teknis, lokasi rak, penyesuaian stok cepat IN/OUT, dan catatan audit QC).
   - Klik item di **Mutasi Stok (Stok Log)** membuka `StockLogDetail.jsx` (rincian bukti mutasi stok sebelum/sesudah, nomor PO/Invoice, petugas, dan link ke komponen terkait).
5. **Siap di-deploy ke Free Hosting (Vercel)**: Dilengkapi konfigurasi `vite-plugin-pwa`, Web App Manifest, dan Service Worker Workbox.

## Cara Menjalankan
```bash
npm install
npm run dev
```
Untuk mem-build versi produksi PWA:
```bash
npm run build
npm run preview -- --host
```
