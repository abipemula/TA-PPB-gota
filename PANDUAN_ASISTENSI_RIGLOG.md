# Panduan Asistensi & Penjelasan Struktur Kode Tugas Akhir PPB 2026

**Judul Tugas Akhir:**
> **RigLog : Sistem inventaris terintegrasi untuk pencatatan, pemantauan stok, dan pengelolaan katalog komponen komputer pada toko hardware**

**Platform Materi:** Progressive Web Apps (PWA) dengan React + Vite (`riglog-pwa`) & Backend RESTful API Node.js + Express + Supabase (`riglog-api`).

---

## 1. Peta Pemenuhan Ketentuan Tugas Akhir (Checklist Asistensi)

Saat asistensi dengan Asprak, kamu bisa langsung menunjukkan bagaimana setiap syarat wajib telah terpenuhi 100%:

| No | Ketentuan Tugas Akhir | Implementasi pada RigLog | Lokasi File Utama |
| :--- | :--- | :--- | :--- |
| 1 | **Menggunakan API (Web Service) buatan sendiri sesuai Modul 1** | Backend Node.js + Express + Supabase dengan pola **MVC-like** (`config`, `models`, `controllers`, `routes`) + `vercel.json`. | Folder `riglog-api/src/` |
| 2 | **Memiliki Bottom Navigation Bar** | Komponen navigasi bawah tetap (`fixed bottom`) dengan 5 tab utama + indikator aktif dan badge counter Watchlist. | `riglog-pwa/src/components/BottomNav.jsx` |
| 3 | **Memiliki minimal 5 halaman** | Memiliki **7 halaman utama & form** + **2 tampilan detail** (Total 9 View):<br>1. **Katalog (`CatalogPage.jsx`)**<br>2. **Mutasi Stok / Stok Log (`StockLogsPage.jsx`)**<br>3. **Watchlist Prioritas (`FavoritesPage.jsx`)**<br>4. **Zona Rak & Supplier (`WarehousePage.jsx`)**<br>5. **Profil & About (`ProfilePage.jsx`)**<br>6. **Tambah Komponen (`CreateHardwarePage.jsx`)**<br>7. **Edit Komponen (`EditHardwarePage.jsx`)** | Folder `riglog-pwa/src/pages/` |
| 4 | **Minimal 2 halaman utama memiliki list & tiap item dapat diklik ke halaman detail** | - **List Utama 1 (`CatalogPage.jsx`)**: Klik kartu komponen membuka **`HardwareDetail.jsx`** (spesifikasi datasheet, lokasi rak, penyesuaian stok cepat IN/OUT, catatan audit QC).<br>- **List Utama 2 (`StockLogsPage.jsx`)**: Klik baris riwayat mutasi stok membuka **`StockLogDetail.jsx`** (rincian bukti mutasi stok sebelum & sesudah, nomor PO/Invoice, petugas, dan tombol lompat ke detail komponen).<br>- **List Tambahan (`FavoritesPage.jsx`)**: Klik item juga membuka **`HardwareDetail.jsx`**. | `CatalogPage.jsx` → `HardwareDetail.jsx`<br>`StockLogsPage.jsx` → `StockLogDetail.jsx` |
| 5 | **Memiliki 1 halaman Profile / About aplikasi** | Menampilkan profil Kepala Gudang/Teknisi (UUID otomatis, edit nama/jabatan/bio, upload foto profil Base64, statistik stok & draft) + bagian **Tentang Aplikasi (About RigLog)**. | `riglog-pwa/src/pages/ProfilePage.jsx` |
| 6 | **Konsep PWA (Modul 4 & 5)** | Menggunakan `vite-plugin-pwa`, Web App Manifest (`manifest.webmanifest`), Service Worker Workbox untuk offline caching, `PWABadge.jsx` (prompt install & indikator offline), serta `localStorage` persistence & Auto-Save Draft. | `riglog-pwa/vite.config.js` & `src/components/PWABadge.jsx` |

---

## 2. Penjelasan Struktur Folder & Arsitektur (Supaya Tidak "Vibecoding")

Proyek dibagi menjadi **2 folder utama** sesuai tahapan modul praktikum:

### A. Folder `riglog-api/` (Backend RESTful API — Referensi Modul 1 Bab II)

Menggunakan arsitektur **MVC-like (Model - Controller - Router)** agar kode terorganisir dan memisahkan tanggung jawab (Separation of Concerns):

```text
riglog-api/
├── src/
│   ├── config/
│   │   ├── supabaseClient.js       # Inisialisasi koneksi ke Supabase menggunakan variabel .env
│   │   └── memoryStore.js          # Data fallback in-memory jika .env Supabase belum diisi
│   ├── models/                     # Lapisan akses data (Query CRUD ke tabel Supabase)
│   │   ├── categoryModel.js        # Operasi CRUD tabel categories (Zona Rak & Kategori PC)
│   │   ├── supplierModel.js        # Operasi CRUD tabel suppliers (Distributor Resmi)
│   │   ├── productModel.js         # Operasi CRUD tabel products (Katalog & Stok Komponen)
│   │   └── stockLogModel.js        # Operasi CRUD tabel stock_logs + update stok otomatis
│   ├── controllers/                # Lapisan logika bisnis & pengelola HTTP Request/Response
│   │   ├── categoryController.js   # Menangani req.body / req.params & status HTTP (200, 201, 400, 404)
│   │   ├── supplierController.js
│   │   ├── productController.js
│   │   └── stockLogController.js
│   ├── routes/                     # Lapisan pemetaan endpoint URL ke fungsi Controller
│   │   ├── categoryRoutes.js       # GET, POST, PUT, DELETE /api/categories
│   │   ├── supplierRoutes.js       # GET, POST, PUT, DELETE /api/suppliers
│   │   ├── productRoutes.js        # GET, POST, PUT, DELETE /api/products
│   │   └── stockLogRoutes.js       # GET, POST, DELETE /api/stock-logs
│   └── index.js                    # Entry point server Express.js, middleware CORS & express.json()
├── supabase_schema.sql             # Query SQL pembuatan tabel & data awal untuk dijalankan di Supabase
├── RigLog_API_Postman_Collection.json # File koleksi Postman siap import untuk demo uji API
├── vercel.json                     # Konfigurasi deployment serverless ke Vercel (Modul 1 Percobaan 2)
└── package.json
```

**Cara menjelaskan alur Backend ke Asprak:**
1. Ketika aplikasi frontend atau Postman mengirim request (misal `GET /api/products` atau `POST /api/stock-logs`), request masuk ke **`src/index.js`**.
2. **`index.js`** meneruskan request ke **`src/routes/productRoutes.js`** sesuai prefix URL-nya.
3. **Router** memanggil fungsi di **`src/controllers/productController.js`** (misalnya `ProductController.getAll`).
4. **Controller** memanggil **`src/models/productModel.js`** yang menjalankan query ke database **Supabase** melalui `supabaseClient.js`, lalu mengembalikan hasilnya dalam format JSON.

---

### B. Folder `riglog-pwa/` (Frontend React + Vite PWA — Referensi Modul 4 & 5)

Menggunakan arsitektur berlapis sesuai **Modul 5 (Bab VI)** yang memisahkan konfigurasi Axios, Services, Custom Hooks, Komponen UI, dan Halaman:

```text
riglog-pwa/
├── public/
│   ├── hardware/                   # Aset ilustrasi vektor SVG komponen (cpu, gpu, motherboard, ram, storage, psu)
│   ├── icon-192.svg & icon-512.svg # Ikon aplikasi untuk instalasi PWA di Android/Desktop
├── src/
│   ├── config/
│   │   └── api.js                  # Instance Axios + Request/Response Interceptor (Modul 5)
│   ├── data/
│   │   └── hardwareData.js         # Data statis awal untuk fallback saat server/internet offline (Modul 4)
│   ├── services/                   # Lapisan komunikasi API + Sinkronisasi localStorage (Modul 5)
│   │   ├── hardwareService.js      # Fetch CRUD produk, kategori, supplier + normalisasi data
│   │   ├── stockLogService.js      # Fetch & catat mutasi stok (IN/OUT) sekaligus mengupdate saldo stok
│   │   ├── favoriteService.js      # Kelola daftar Watchlist komponen prioritas
│   │   ├── reviewService.js        # Kelola catatan audit QC fisik komponen
│   │   ├── uploadService.js        # Upload foto komponen ke Supabase Storage / fallback Base64 Data URL
│   │   └── userService.js          # Generate UUID RFC4122 v4 & simpan profil petugas di localStorage
│   ├── hooks/                      # React Custom Hooks untuk manajemen state asinkron (Modul 5)
│   │   ├── useHardware.js          # Hook { items, loading, error, source, refetch }
│   │   ├── useStockLogs.js         # Hook { logs, loading, error, refetch } & useCreateStockLog()
│   │   ├── useFavorites.js         # Hook dual-mode API + localStorage untuk Watchlist
│   │   └── useReviews.js           # Hook untuk mengambil & mengirim catatan audit QC
│   ├── utils/
│   │   ├── draftStorage.js         # Auto-save & restore draft form setiap 30 detik di localStorage
│   │   └── helpers.js              # Fungsi format Rupiah (formatPrice), tanggal, filter, & sortir
│   ├── components/
│   │   ├── Header.jsx              # Navigasi atas & tombol tambah komponen
│   │   ├── BottomNav.jsx           # Bottom Navigation Bar (5 menu utama)
│   │   ├── PWABadge.jsx            # Tombol install PWA & banner pemberitahuan mode offline
│   │   ├── common/                 # AdvancedFilter, FavoriteButton, SplashScreen
│   │   ├── modals/                 # ConfirmModal (dialog konfirmasi hapus & pemulihan draft)
│   │   └── hardware/
│   │       ├── HardwareCard.jsx    # Kartu item komponen pada grid katalog
│   │       ├── HardwareDetail.jsx  # Halaman Detail Komponen + Quick Stock Adjust (IN/OUT) + Audit QC
│   │       └── StockLogDetail.jsx  # Halaman Detail Bukti Mutasi Stok Gudang
│   ├── pages/
│   │   ├── CatalogPage.jsx         # Halaman Utama 1: Katalog & Pemantauan Stok (List -> Detail)
│   │   ├── StockLogsPage.jsx       # Halaman Utama 2: Riwayat & Pencatatan Mutasi Stok (List -> Detail)
│   │   ├── FavoritesPage.jsx       # Halaman 3: Watchlist Stok Prioritas
│   │   ├── WarehousePage.jsx       # Halaman 4: Zona Rak Gudang & Direktori Supplier
│   │   ├── ProfilePage.jsx         # Halaman 5: Profil Operator & About Aplikasi
│   │   ├── CreateHardwarePage.jsx  # Halaman 6: Form 2 Langkah Tambah Komponen + Auto-Save Draft
│   │   └── EditHardwarePage.jsx    # Halaman 7: Form Edit Komponen
│   ├── App.jsx                     # State navigasi terpadu (Unified Navigation Handler)
│   └── main.jsx                    # Entry point React DOM
└── vite.config.js                  # Konfigurasi Vite + VitePWA (Manifest & Workbox Service Worker)
```

---

## 3. Tanya-Jawab Kunci Saat Asistensi & Responsi dengan Asprak

Berikut daftar pertanyaan yang paling sering ditanyakan Asprak saat asistensi/responsi beserta jawaban tepatnya:

1. **"Bagaimana cara aplikasi kamu menghubungkan Frontend PWA dengan Backend API?"**
   - **Jawaban:** Menggunakan **Axios instance** di `src/config/api.js` yang membaca `VITE_API_BASE_URL` dari file `.env`. Di dalamnya terdapat **Request Interceptor** (untuk menyisipkan header otorisasi/API key) dan **Response Interceptor** (untuk mengekstrak `response.data` dan menormalisasi pesan error). Fungsi pemanggilan endpoint dibungkus di dalam folder `src/services/` dan dipanggil oleh komponen melalui **Custom Hooks** di `src/hooks/`.

2. **"Apa yang terjadi kalau aplikasi dibuka saat offline atau backend dimatikan?"**
   - **Jawaban:** Sesuai konsep **Progressive Web App (PWA)** pada Modul 4 & 5:
     - **Aset Statis & Application Shell** (HTML, CSS, JS, ikon SVG) di-cache oleh **Service Worker Workbox** yang dikonfigurasi pada `vite.config.js`.
     - **Data Dinamis** memiliki mekanisme **Dual-Mode Fallback** pada `hardwareService.js`, `stockLogService.js`, dan `useFavorites.js`: jika request ke server gagal/offline, aplikasi otomatis membaca dan menyimpan perubahan ke `localStorage` sehingga fitur CRUD, pencatatan mutasi stok, dan Watchlist tetap berfungsi 100% tanpa error.

3. **"Tunjukkan mana 2 halaman utama yang punya list dan bisa diklik ke halaman detail!"**
   - **Jawaban:**
     - Pertama adalah halaman **Katalog (`CatalogPage.jsx`)**: menampilkan daftar komponen komputer beserta indikator stok aman/menipis. Ketika salah satu kartu diklik, state `selectedItem` aktif dan merender halaman **`HardwareDetail.jsx`**.
     - Kedua adalah halaman **Mutasi Stok / Stok Log (`StockLogsPage.jsx`)**: menampilkan daftar riwayat barang masuk (`IN`) dan keluar (`OUT`). Ketika salah satu baris transaksi diklik, state `selectedLog` aktif dan merender halaman **`StockLogDetail.jsx`** yang menampilkan rincian perubahan stok sebelum dan sesudah mutasi.

4. **"Bagaimana cara kerja fitur pencatatan stok di RigLog?"**
   - **Jawaban:** Pencatatan stok terintegrasi di dua tempat: melalui tombol **Catat Mutasi Baru** di halaman `StockLogsPage.jsx` atau melalui panel **Pencatatan Cepat Mutasi Stok (IN/OUT)** di dalam `HardwareDetail.jsx`. Saat petugas mencatat barang masuk (`IN`), stok produk otomatis bertambah (`previous_stock + quantity`); saat mencatat barang keluar (`OUT`), stok produk otomatis berkurang (`previous_stock - quantity`), dan riwayatnya langsung tersimpan ke tabel/koleksi `stock_logs`.
