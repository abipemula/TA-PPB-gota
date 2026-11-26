# Panduan Lengkap Responsi TA PPB — RigLog

Dokumen ini disusun khusus untuk membantu kamu menghadapi **Responsi Tugas Akhir Praktikum PPB** dengan tenang dan percaya diri. Semua penjelasan ditulis dengan bahasa sederhana agar mudah dipahami dan langsung bisa dipakai saat presentasi, live demo, maupun tanya-jawab kode bersama asprak.

---

## 1. Kalimat Pembuka 30 Detik (Jika Ditanya: "Jelaskan aplikasimu!")

> **"RigLog adalah aplikasi Progressive Web App (PWA) untuk sistem inventaris gudang sekaligus katalog belanja komponen komputer. Aplikasi ini memiliki dua mode pengguna: Mode Customer untuk mencari komponen, memasukkan ke keranjang, dan melakukan simulasi checkout pembayaran lokal; serta Mode Admin yang dilindungi password untuk mengelola katalog komponen (CRUD), mencatat mutasi stok masuk/keluar, mengelola supplier, dan kustomisasi tampilan toko. Arsitekturnya memisahkan frontend React+Vite PWA, backend REST API buatan sendiri menggunakan Express.js sesuai Modul 1, dan database PostgreSQL di cloud Neon yang semuanya sudah di-deploy online di Vercel."**

---

## 2. Arsitektur Besar Program (Wajib Paham Konsepnya)

Aplikasi terdiri dari **3 lapisan utama** (3-tier architecture):

1. **Frontend (`riglog-pwa`) — React + Vite + PWA (`vite-plugin-pwa`)**
   - Bertugas menampilkan UI, menerima input user, dan menyimpan data lokal ringan (isi keranjang & token login admin).
   - **PENTING:** Frontend **TIDAK PERNAH** langsung menghubungi Neon/Supabase. Semua permintaan data wajib lewat file `riglog-pwa/src/config/api.js` (Axios) menuju Backend Express API kita sendiri.

2. **Backend (`riglog-api`) — Node.js + Express.js (Pola Modul 1)**
   - Mengikuti pola arsitektur terpisah:
     - `src/index.js` → Entry point server Express, pengaturan CORS, `Cache-Control: no-store`, upload gambar, dan pendaftaran semua route.
     - `src/config/db.js` → Koneksi PostgreSQL Pool (`pg`) ke Neon via `DATABASE_URL` + fungsi `ensurePostgresReady()` yang otomatis membuat tabel dan data awal jika belum ada.
     - `src/middleware/adminAuth.js` → Penjaga (*satpam*) endpoint khusus admin; mengecek token HMAC pada header `Authorization: Bearer <token>`.
     - `src/routes/` → Menentukan alamat URL endpoint & metode HTTP (`GET`, `POST`, `PUT`, `DELETE`).
     - `src/controllers/` → Menerima `req`, memanggil Model, dan mengembalikan response JSON (`res.json(...)`).
     - `src/models/` → Menjalankan query SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) ke database PostgreSQL.

3. **Database (`Neon PostgreSQL Cloud`)**
   - Menyimpan 5 tabel utama secara permanen di cloud:
     1. `categories` — Daftar kategori komponen (CPU, GPU, RAM, SSD, Motherboard, PSU).
     2. `products` — Data katalog komponen (SKU, nama, brand, harga, stok, batas minimum, lokasi rak, deskripsi, gambar, spesifikasi, SOP).
     3. `suppliers` — Daftar distributor/supplier resmi.
     4. `stock_logs` — Riwayat mutasi stok (`IN` / `OUT`), lengkap dengan stok sebelum, stok sesudah, nomor referensi/invoice, operator, dan catatan.
     5. `app_settings` — Pengaturan toko yang bisa diedit Admin (profil pengelola, logo brand kustom, ikon Bottom Navbar, dan link media sosial footer).

---

## 3. Urutan Skenario Live Demo Responsi (±5 Menit)

Ikuti urutan ini saat demo agar semua fitur & revisi terlihat mulus:

### Bagian A — Mode Customer (Belum Login Admin)
1. **Halaman Katalog (`Katalog`):**
   - Tunjukkan 4 kartu KPI inventaris di atas dan 3 bagian highlight (*Rekomendasi Minggu Ini*, *Produk Terlaris*, *Produk Pilihan*).
   - Coba ketik di kolom **Pencarian** atau klik filter kategori / **Shop by Brand** di bawah (klik ulang untuk reset filter).
2. **Halaman Detail Komponen (Customer):**
   - Klik salah satu komponen → tunjukkan bahwa di mode customer **tidak ada** tombol Edit/Hapus dan **tidak ada** tulisan *Prosedur Penyimpanan & QC Gudang*.
   - Klik **Beli Sekarang** → pilih jumlah, pilih metode pembayaran lokal (misal **GoPay** atau **Bank BCA**) → ketik nominal persis sama dengan total tagihan → tunjukkan transaksi **otomatis checkout** dan langsung keluar **Struk Lunas** serta stok otomatis berkurang.
3. **Halaman Keranjang (`Keranjang`):**
   - Tambahkan beberapa komponen ke Keranjang lewat ikon keranjang di kartu produk, lalu buka tab **Keranjang**.
   - Tunjukkan layout **vertikal atas-ke-bawah**, foto tampil instan (realtime), fitur **Pilih Semua** atau centang sebagian barang saja (misal centang 2 dari 4 barang), dan lihat **Daftar Barang yang Akan di-CO** + **Total Harga** berubah otomatis.
   - Lakukan checkout sebagian barang → tunjukkan barang yang dicentang masuk struk & terhapus dari keranjang, sementara **barang yang tidak dicentang tetap tersisa di keranjang**.
4. **Fitur PWA (`Install App`):**
   - Tunjukkan tombol merah **Install App** di pojok kanan bawah (dan ikon install di address bar Chrome) yang menandakan aplikasi valid sebagai PWA.

### Bagian B — Mode Admin (Login Password)
5. **Login Admin (`Profil/About`):**
   - Buka tab **Profil/About** → tunjukkan bahwa pengunjung biasa hanya melihat profil (*read-only*).
   - Masukkan password admin **`riglog2026`** → klik **Masuk Mode Admin**.
   - Tunjukkan badge hijau **Admin Aktif** muncul di kanan atas.
6. **CRUD Komponen & Auto-Log (`Katalog` → `+ Tambah Komponen` / `Edit`):**
   - Klik **Tambah Komponen** atau **Edit** salah satu produk → tunjukkan panah segitiga harga (`▲ / ▼` naik-turun per Rp 50.000) dan tetap bisa ketik harga custom bebas (misal `2180000`).
   - Tunjukkan di halaman Detail versi Admin sekarang muncul **Lokasi Rak**, **Mutasi Cepat IN/OUT**, tombol **Edit/Hapus**, dan **Prosedur Penyimpanan & QC Gudang**.
7. **Mutasi Stok (`Stok Log`):**
   - Buka tab **Stok Log** → tunjukkan bahwa transaksi pembelian customer tadi dan penambahan/perubahan stok otomatis tercatat sebagai log `OUT` / `IN`.
   - Klik kartu KPI **Barang Masuk** atau **Barang Keluar** untuk memfilter, lalu klik lagi untuk reset.
   - Klik salah satu baris mutasi untuk menunjukkan halaman **Detail Bukti Mutasi**.
8. **Gudang & Kustomisasi Admin (`Gudang` & `Profil/About`):**
   - Buka tab **Gudang** → tunjukkan daftar kategori, klik tombol `+ Tambah Supplier` (ikon `+` berubah jadi `-` saat terbuka).
   - Kembali ke **Profil/About** → tunjukkan panel edit profil, tombol terpisah **Upload/Reset Logo Brand**, pengaturan **Ikon Bottom Navbar**, dan edit **Link Media Sosial** footer.
   - Arahkan kursor ke badge hijau **Admin Aktif** di kanan atas → tunjukkan popup **Keluar Mode Admin** langsung muncul di bawahnya, klik untuk logout instan tanpa konfirmasi.

---

## 4. Peta Cepat File ("Kalau Asprak Tanya Kode Ini Ada di Mana?")

### Backend (`riglog-api/src/`)
- **Server utama, CORS, Anti-cache, Upload gambar:** `src/index.js`
- **Koneksi PostgreSQL Neon & Auto-create tabel:** `src/config/db.js`
- **Login Admin & Verifikasi Token:** `src/routes/authRoutes.js` dan `src/middleware/adminAuth.js`
- **CRUD Produk + Auto-log stok saat create/edit:** `src/routes/productRoutes.js`, `src/controllers/productController.js`, `src/models/productModel.js`
- **Mutasi Stok (`IN`/`OUT`):** `src/routes/stockLogRoutes.js`, `src/controllers/stockLogController.js`, `src/models/stockLogModel.js`
- **Checkout Customer (Single & Keranjang Batch):** `src/routes/checkoutRoutes.js`
- **Kategori & Supplier:** `src/routes/categoryRoutes.js`, `src/routes/supplierRoutes.js`, beserta controller & modelnya
- **Pengaturan Toko (Profil, Logo Brand, Ikon Navbar, Sosmed):** `src/routes/settingsRoutes.js`, `src/controllers/settingsController.js`, `src/models/settingsModel.js`

### Frontend (`riglog-pwa/`)
- **Konfigurasi PWA, Manifest, Ikon & Workbox Service Worker:** `vite.config.js`
- **Konfigurasi Axios ke Backend API + kirim Token Admin otomatis:** `src/config/api.js`
- **Routing antar 5 halaman + Detail + Create/Edit:** `src/App.jsx`
- **Header (Logo + Hover Logout Admin):** `src/components/Header.jsx`
- **Navigasi Bawah 5 Tab + Custom Icon:** `src/components/BottomNav.jsx`
- **Tombol Install App (PWA):** `src/components/PWABadge.jsx`
- **Halaman Katalog + Highlight + Shop by Brand:** `src/pages/CatalogPage.jsx`
- **Halaman Detail Komponen + Beli/Checkout Customer + Mutasi Cepat Admin:** `src/components/hardware/HardwareDetail.jsx`
- **Halaman Keranjang Vertikal + Centang Sebagian + Batch Checkout:** `src/pages/FavoritesPage.jsx`
- **Halaman Stok Log + Filter KPI:** `src/pages/StockLogsPage.jsx` & `src/components/hardware/StockLogDetail.jsx`
- **Halaman Gudang & Supplier:** `src/pages/WarehousePage.jsx`
- **Halaman Profil, Login Admin, Logo Brand, Ikon Navbar, Link Sosmed:** `src/pages/ProfilePage.jsx`
- **Form Tambah & Edit Komponen + Stepper Harga ±50rb:** `src/pages/CreateHardwarePage.jsx` & `src/pages/EditHardwarePage.jsx`
- **Footer (Link Media Sosial sinkron dari DB):** `src/components/Footer.jsx` (default link awal ada di `src/config/siteConfig.js`)
- **Service API & In-Memory Cache Realtime:** `src/services/hardwareService.js` & `src/hooks/useHardware.js`
- **Kompresi & Upload Gambar:** `src/services/uploadService.js`

---

## 5. Tiga Alur Kode End-to-End yang Wajib Kamu Kuasai

Asprak hampir pasti akan meminta kamu menelusuri minimal 1 alur dari tombol di layar sampai masuk database. Hafalkan alur 6 langkah ini:

### Alur 1: Admin Menambah Komponen Baru
1. User isi form di `CreateHardwarePage.jsx` lalu klik **Simpan**.
2. Gambar dikompres dulu di browser oleh `uploadService.js` lalu dikirim ke `POST /api/upload`.
3. `hardwareService.createProduct()` mengirim `POST /api/products` lewat Axios (`api.js` otomatis menyisipkan header `Authorization: Bearer <token>`).
4. Di backend, `productRoutes.js` melewatkan request ke middleware `requireAdmin` (`adminAuth.js`) untuk cek apakah token valid.
5. `productController.create()` meneruskan data ke `productModel.create()`.
6. `productModel.create()` menjalankan query `INSERT INTO products ...` ke Neon PostgreSQL **dan** otomatis memanggil `insertAutoStockLog()` untuk `INSERT INTO stock_logs ...` supaya stok awalnya langsung tercatat di **Stok Log**.

### Alur 2: Customer Checkout (Single di Detail / Batch di Keranjang)
1. Customer centang barang (di `FavoritesPage.jsx`) atau klik **Beli Sekarang** (di `HardwareDetail.jsx`), pilih metode bayar, lalu ketik nominal harga.
2. Begitu nominal ketikan persis sama dengan `totalPrice`, `useEffect` otomatis memanggil `hardwareService.checkout({ items, payment_method, paid_amount, customer_name })`.
3. Request `POST /api/checkout` (endpoint publik tanpa `requireAdmin`) masuk ke `riglog-api/src/routes/checkoutRoutes.js`.
4. Backend mengecek dulu stok **semua** barang dan memastikan `paid_amount >= grandTotal`. Jika ada 1 saja yang kurang stok/kurang bayar, transaksi dibatalkan (400) tanpa mengubah database.
5. Jika valid, backend membuat 1 nomor invoice (`INV-xxxxxx`) lalu untuk setiap barang memanggil `StockLogModel.create({ type: "OUT", ... })` yang sekaligus mengurangi `products.stock` dan mencatat `stock_logs` di Neon.
6. Frontend menerima struk `201`, langsung memperbarui stok di cache memori, dan jika berasal dari Keranjang hanya menghapus ID barang yang dicentang lewat `removeFavorites(checkedOutIds)` sehingga barang yang tidak dicentang tetap ada di Keranjang.

### Alur 3: Login & Keamanan Mode Admin
1. Admin mengetik password di `ProfilePage.jsx` → `authService.login(password)` kirim `POST /api/auth/login`.
2. `authRoutes.js` membandingkan password dengan `process.env.ADMIN_PASSWORD` (default `riglog2026`).
3. Jika benar, `adminAuth.js` membuat token terenkripsi **HMAC-SHA256** (stateless, cocok untuk Vercel Serverless) dan mengirimnya ke frontend.
4. Frontend menyimpan token di `localStorage` dan otomatis menyertakannya di setiap request Axios melalui interceptor di `src/config/api.js`.
5. Setiap endpoint sensitif (`POST/PUT/DELETE /api/products`, `POST /api/stock-logs`, `PUT /api/settings`, `POST /api/upload`) dilindungi middleware `requireAdmin`, sehingga orang luar tidak bisa mengubah data walaupun menembak API langsung pakai Postman/curl.

---

## 6. Bank Pertanyaan Responsi Asprak & Cara Jawabnya

### Q1: "Apa itu PWA dan apa saja syarat agar aplikasimu bisa di-install sebagai PWA?"
**Jawab:**
PWA (Progressive Web App) adalah aplikasi web yang bisa di-install dan berjalan seperti aplikasi native di HP/desktop. Syarat utamanya ada 3 dan semuanya sudah terpenuhi di RigLog:
1. Berjalan di **HTTPS** (sudah di Vercel).
2. Memiliki **Web App Manifest** valid (nama, `display: standalone`, dan ikon PNG persegi `192x192` & `512x512` yang diatur di `vite.config.js`).
3. Memiliki **Service Worker** aktif (dihasilkan otomatis oleh `vite-plugin-pwa` / Workbox).

### Q2: "Bagaimana strategi caching Service Worker di aplikasimu supaya data stok tidak basi?"
**Jawab:**
Di `vite.config.js`, aset statis (JS, CSS, HTML, ikon) di-precache oleh Workbox agar aplikasi cepat dibuka, sedangkan semua request ke `/api/` diatur memakai strategi **`NetworkOnly`** (ditambah header `Cache-Control: no-store` di backend Express). Jadi data stok dan produk selalu diambil segar dari server, tidak nyangkut di cache lama.

### Q3: "Kenapa perpindahan ke halaman Keranjang sekarang cepat / realtime tidak menunggu loading lama?"
**Jawab:**
Di `hardwareService.js` dan `useHardware.js` digunakan pola **Stale-While-Revalidate (in-memory cache)**: saat Katalog sudah dimuat, daftar produk beserta fotonya disimpan di memori aplikasi. Saat pindah tab ke Keranjang, gambar langsung tampil dalam 0ms sambil tetap mengambil pembaruan terbaru dari `/api/products` di latar belakang. Selain itu `uploadService.js` mengompres gambar lewat `<canvas>` maksimal 768px sebelum disimpan agar payload ringan.

### Q4: "Kenapa frontend tidak dihubungkan langsung ke database Neon/Supabase?"
**Jawab:**
Sesuai prinsip arsitektur client-server (dan ketentuan Modul 1), kredensial database (`DATABASE_URL`) dan logika bisnis (seperti validasi stok saat checkout, auto-log mutasi stok, dan otorisasi Admin) harus berada di sisi server (**Express API**). Jika frontend akses DB langsung, kredensial bisa bocor dan siapa saja bisa memanipulasi stok.

### Q5: "Perbedaan data yang disimpan di PostgreSQL (Neon) dan yang di `localStorage` apa?"
**Jawab:**
- **PostgreSQL (Neon):** Semua data utama & global yang harus sama untuk semua pengguna — produk, kategori, supplier, riwayat mutasi stok (`stock_logs`), dan pengaturan toko (`app_settings`: profil admin, logo brand, ikon navbar, link sosmed).
- **`localStorage` browser:** Hanya data pribadi per perangkat — daftar isi Keranjang masing-masing pembeli, token sesi login admin, dan cache offline sementara.

### Q6: "Apa fungsi `useState`, `useEffect`, `useMemo`, dan custom hook di React-mu?"
**Jawab:**
- `useState`: Menyimpan state yang bisa berubah di tampilan (misal teks pencarian, filter aktif, daftar barang yang dicentang di keranjang, status modal).
- `useEffect`: Menjalankan efek samping saat komponen dimuat atau state tertentu berubah (misal memanggil API saat halaman dibuka, atau memicu auto-checkout saat nominal ketikan pas).
- `useMemo`: Mengingat hasil perhitungan berat seperti memfilter/mengurutkan katalog atau menjumlahkan total harga keranjang supaya tidak dihitung ulang terus-menerus.
- Custom hook (`useHardware`, `useStockLogs`, `useFavorites`): Membungkus logika pengambilan data supaya rapi dan bisa dipakai ulang di banyak halaman.

### Q7: "Bagaimana cara kerja HTTP Method di REST API yang kamu buat?"
**Jawab:**
- `GET` → Mengambil data (contoh: `GET /api/products`, `GET /api/stock-logs`).
- `POST` → Membuat data baru atau proses transaksi (contoh: `POST /api/products`, `POST /api/checkout`, `POST /api/auth/login`).
- `PUT` → Memperbarui data yang sudah ada (contoh: `PUT /api/products/:id`, `PUT /api/settings`).
- `DELETE` → Menghapus data (contoh: `DELETE /api/products/:id`).

### Q8: "Kenapa kemarin sempat error saat deploy backend ke Vercel dan bagaimana cara memperbaikinya?"
**Jawab:**
Karena Vercel Serverless memiliki sistem file *read-only* (tidak bisa menulis folder `/uploads` di disk). Solusinya di `riglog-api/src/index.js`, pembuatan folder `uploads` dilewati saat `process.env.VERCEL` aktif, dan endpoint `/api/upload` langsung mengembalikan gambar terkompresi dalam format `dataUrl` (Base64) untuk disimpan di kolom database PostgreSQL. Selain itu ditambahkan konfigurasi CORS lengkap termasuk `app.options("*", cors())`.

### Q9: "Kenapa token login admin pakai HMAC dan bukan simpan sesi di RAM server?"
**Jawab:**
Karena di Vercel Serverless setiap request bisa dijalankan di instance yang berbeda sehingga memori RAM tidak menetap. Token berbasis **HMAC-SHA256** bersifat *stateless*: backend cukup memverifikasi tanda tangan kriptografi token menggunakan secret tanpa perlu menyimpan session di RAM.

### Q10: "Kalau harga produk di-checkout 2 barang sekaligus, apa yang terjadi kalau salah satu stoknya habis?"
**Jawab:**
Di `riglog-api/src/routes/checkoutRoutes.js`, backend melakukan loop validasi stok untuk **seluruh** barang di array `items` terlebih dahulu sebelum mengubah stok satu pun. Jika ada satu barang yang stoknya tidak cukup, API langsung mengembalikan error `400` sehingga tidak terjadi pengurangan stok setengah-setengah.

### Q11: "Di mana letak kode kalau saya minta ganti password admin atau warna tema?"
**Jawab:**
- **Password Admin:** Di Environment Variable `ADMIN_PASSWORD` (di Vercel / `riglog-api/.env`), dengan fallback default `riglog2026` di `riglog-api/src/middleware/adminAuth.js`.
- **Warna Tema (Merah/Navy AGRES):** Di CSS variables (`:root`) pada `riglog-pwa/src/index.css` dan styling komponen di `riglog-pwa/src/App.css`.
- **Link Media Sosial / Logo Default:** Default-nya di `riglog-pwa/src/config/siteConfig.js`, dan versi editan Admin tersimpan di tabel `app_settings` PostgreSQL melalui `riglog-api/src/models/settingsModel.js`.

### Q12: "Apa fungsi CORS di backend?"
**Jawab:**
CORS (*Cross-Origin Resource Sharing*) mengizinkan browser di domain frontend (`riglog-pwa.vercel.app`) untuk mengirim request API ke domain backend yang berbeda (`riglog-api...vercel.app`). Tanpa middleware `cors()` di `riglog-api/src/index.js`, browser akan memblokir seluruh request API.

---

## 7. Checklist Persiapan 10 Menit Sebelum Responsi

- [ ] Buka tab browser 1: **`https://riglog-pwa.vercel.app`** (hard refresh `Ctrl + Shift + R` sekali supaya versi terbaru yang aktif).
- [ ] Buka tab browser 2: **URL backend `riglog-api` Vercel** (halaman `/` menampilkan JSON daftar endpoint + status `PostgreSQL Cloud (Neon)` — bagus banget untuk bukti ke asprak!).
- [ ] Buka tab browser 3 (opsional): **Dashboard Neon** atau **GitHub Repo** (`https://github.com/abipemula/TA-PPB-gota`).
- [ ] Buka **VS Code** di folder `d:\TA PPB SEM 5` dan siapkan 3 file utama biar cepat dibuka kalau ditanya:
  1. `riglog-api/src/index.js` & `riglog-api/src/routes/checkoutRoutes.js`
  2. `riglog-api/src/models/productModel.js`
  3. `riglog-pwa/src/config/api.js` & `riglog-pwa/src/pages/FavoritesPage.jsx`
- [ ] Pastikan kamu mulai demo dalam keadaan **logout (Mode Customer)** dulu, baru nanti login Admin (`riglog2026`) saat mendemokan fitur Admin.
- [ ] Ingat: jangan panik kalau lupa nama fungsi persisnya — jelaskan saja **alur logikanya** (Frontend → Service/Axios → Route Express → Middleware/Controller → Model SQL → Neon PostgreSQL), lalu buka file yang ada di Bagian 4 panduan ini!

---

## 8. Challenge Nilai Tambah (Direct Link Produk & Offline-First Auto-Sync)

Bagian ini merangkum **2 fitur Challenge Nilai Tambah** beserta **daftar persis file & bagian kode yang diubah** supaya kamu bisa langsung menunjukkannya ke Asprak saat responsi.

### Challenge 1 — Direct Link Produk Eksternal (Shopee / Tokopedia / Custom URL)

**Cara Kerja:**
- Saat **Admin** menambah komponen baru (misal GPU/RAM) atau mengedit produk yang sudah ada, tersedia kolom input **Link Produk Eksternal (Shopee / Tokopedia / Custom URL)**.
- URL otomatis dinormalisasi (jika admin lupa menulis `https://`, otomatis ditambahkan), lalu disimpan permanen ke kolom `product_url` pada tabel `products` di **Neon PostgreSQL** lewat Express API.
- Saat **Customer** maupun **Admin** membuka halaman Detail Komponen, muncul tombol ikon bundar mirip **Share Link** tepat di sebelah kanan tombol **Keranjang**. Jika diklik, langsung membuka halaman produk Shopee/Tokopedia/URL tujuan di tab baru.

**Daftar File & Kode yang Diubah (Challenge 1):**
1. **`riglog-api/src/config/db.js`**
   - Menambahkan kolom `product_url text DEFAULT ''` pada skema tabel `products` serta query migrasi aman `ALTER TABLE products ADD COLUMN IF NOT EXISTS product_url text DEFAULT '';` agar database Neon yang sudah aktif langsung mendapatkan kolom baru tanpa menghapus data lama.
2. **`riglog-api/src/models/productModel.js`**
   - Memperbarui fungsi `ProductModel.create(payload)` (`INSERT INTO products ... product_url ...`) dan `ProductModel.update(id, payload)` (`UPDATE products SET ... product_url=$11 ...`) agar field `product_url` ikut tersimpan dan ter-update di PostgreSQL Neon.
3. **`riglog-pwa/src/services/hardwareService.js`**
   - Menambahkan helper `normalizeExternalUrl()` (otomatis menambahkan `https://` jika belum ada) dan meneruskan field `product_url` pada `normalizeProduct()`, `createProduct()`, serta `updateProduct()`.
4. **`riglog-pwa/src/pages/CreateHardwarePage.jsx` & `riglog-pwa/src/pages/EditHardwarePage.jsx`**
   - Menambahkan state `formData.product_url`, kolom input **Link Produk Eksternal (Shopee / Tokopedia / Custom URL)** pada form, serta menyertakan `product_url` saat submit ke backend.
5. **`riglog-pwa/src/components/hardware/HardwareDetail.jsx` & `riglog-pwa/src/App.css`**
   - Menambahkan tombol ikon bundar `Share2` (`className="fav-btn product-link-btn"`) tepat di sebelah kanan `<FavoriteButton />` (tombol Keranjang) dengan `target="_blank" rel="noopener noreferrer"` dan tooltip otomatis mendeteksi Shopee/Tokopedia/URL kustom.

---

### Challenge 2 — Tambah Produk & Stok Gudang Secara Offline + Auto-Sync ke Server

**Cara Kerja (Arsitektur Offline-First Outbox):**
1. **Penyimpanan di Disk (IndexedDB + `localStorage` Mirror):**
   - Saat laptop **tidak terkoneksi internet** (`!navigator.onLine` atau request terkena `isNetworkError`), seluruh data penambahan komponen baru (termasuk foto hasil kompresi Base64, jumlah stok, spesifikasi, dan **custom URL Shopee/Tokopedia**), edit produk, maupun mutasi stok langsung dimasukkan ke **antrean offline di disk (`riglog_offline_db` di IndexedDB + mirror `localStorage`)** melalui `offlineSyncService.js`.
   - Service Worker Workbox (`vite.config.js`) juga di-set `navigateFallback: '/index.html'`, `clientsClaim: true`, dan `skipWaiting: true` agar saat browser **di-refresh tanpa koneksi internet**, aplikasi PWA tetap terbuka normal dari disk (bukan halaman error offline Chrome).
   - `authService.verify()` mempertahankan sesi Admin saat offline sehingga setelah refresh tanpa internet, user tetap berada di **Mode Admin**.
2. **Tampil Tetap Ada Setelah Refresh Offline:**
   - Fungsi `mergePendingQueueIntoProducts()` & `mergePendingQueueIntoLogs()` otomatis menggabungkan cache produk terakhir dengan antrean offline di disk.
   - Produk yang baru ditambah saat offline langsung muncul di Katalog dengan label kuning **`Offline · Belum Sync`** — dan **tetap muncul utuh beserta stok, foto, dan link URL-nya meski browser di-refresh berkali-kali tanpa internet**.
3. **Auto-Sync Otomatis Saat Kembali Online (Sinkron ke HP Asprak):**
   - Begitu Wi-Fi laptop disambungkan kembali ke internet, listener `window.addEventListener('online', ...)` (didukung retry otomatis tiap 6 detik jika jaringan belum stabil) memanggil `syncPendingOfflineQueue()`.
   - Antrean dikirim berurutan (FIFO) ke `POST /api/products` / `PUT /api/products/:id` / `POST /api/stock-logs` di `riglog-api` → tersimpan permanen di **Neon PostgreSQL** (termasuk mencatat log stok `IN` otomatis).
   - Badge kuning **`Offline · Belum Sync`** otomatis hilang, muncul notifikasi hijau **`"X data offline berhasil disinkronkan ke server Neon!"`**, dan ketika **HP Asprak** membuka/refresh `riglog-pwa.vercel.app`, produk baru beserta stok & custom URL-nya langsung tampil sinkron!

**Daftar File & Kode yang Diubah (Challenge 2):**
1. **`riglog-pwa/src/services/offlineSyncService.js` *(File Baru)***
   - Mengelola database disk **IndexedDB (`riglog_offline_db`)** + mirror `localStorage`, antrean `enqueueOfflineOperation()`, penggabungan data `mergePendingQueueIntoProducts()` / `mergePendingQueueIntoLogs()`, hidrasi `hydrateOfflineStore()`, dan mesin sinkronisasi otomatis `syncPendingOfflineQueue()`.
2. **`riglog-pwa/src/services/hardwareService.js` & `riglog-pwa/src/services/stockLogService.js`**
   - Menghubungkan `getProducts()`, `createProduct()`, `updateProduct()`, `getStockLogs()`, dan `createStockMovement()` ke `offlineSyncService` sehingga operasi tulis saat offline langsung masuk antrean disk & langsung terlihat di UI.
3. **`riglog-pwa/src/services/uploadService.js`**
   - Saat offline, gambar tetap dikompresi secara lokal di browser (WebP/JPEG via `<canvas>`) dan langsung dikembalikan sebagai `dataUrl` agar foto ikut tersimpan di disk & tersinkron ke Neon saat online.
4. **`riglog-pwa/src/services/authService.js`**
   - Menambahkan pengecekan `if (!navigator.onLine) return true` pada `verify()` agar sesi login Admin tidak ter-logout saat browser di-refresh tanpa internet.
5. **`riglog-pwa/vite.config.js`**
   - Menambahkan `navigateFallback: '/index.html'`, `cleanupOutdatedCaches: true`, `clientsClaim: true`, dan `skipWaiting: true` pada konfigurasi Workbox PWA agar reload halaman saat offline selalu sukses dari cache disk.
6. **`riglog-pwa/src/App.jsx`, `src/hooks/useHardware.js`, `src/hooks/useStockLogs.js`**
   - Memanggil `hydrateOfflineStore()` saat boot, memasang auto-sync pada event `online`, `visibilitychange`, dan retry timer 6 detik, serta memperbarui UI otomatis saat event `riglog-offline-synced` diterima.
7. **`riglog-pwa/src/components/PWABadge.jsx`, `HardwareCard.jsx`, `HardwareDetail.jsx`, & `App.css`**
   - Menampilkan status antrean offline di pojok kiri bawah, tombol **Sync Sekarang** (opsional manual), notifikasi hijau saat sync sukses, serta badge amber **`Offline · Belum Sync`** pada kartu & detail produk yang masih menunggu sinkronisasi.

---

### Skenario Demo Challenge di Depan Asprak (Biar Sukses 100%)
1. **Pastikan dulu saat ONLINE:** Buka `https://riglog-pwa.vercel.app` di laptop, hard refresh sekali (`Ctrl + Shift + R`) agar Service Worker versi terbaru aktif, lalu **Login Admin (`riglog2026`)**.
2. **Minta Asprak buka `https://riglog-pwa.vercel.app` di HP-nya** → catat jumlah komponen & stok saat ini (sebelum ditambah).
3. **Matikan Wi-Fi laptop (OFFLINE total):**
   - Tunjukkan indikator pojok kiri bawah berubah menjadi **Mode Offline**.
   - Klik **`+ Tambah Komponen`** → pilih gambar / preset → isi nama produk (misal GPU/RAM baru), stok (misal `15`), dan isi **Link Produk Eksternal** (misal link Shopee/Tokopedia) → klik **Simpan**.
   - Tunjukkan produk baru langsung muncul di Katalog dengan badge **`Offline · Belum Sync`**, klik detailnya untuk menunjukkan tombol **ikon Share Link** di samping kanan tombol Keranjang sudah aktif!
   - **Tekan F5 / Refresh browser di laptop dalam keadaan MASIH OFFLINE** → tunjukkan aplikasi tetap terbuka normal dan **produk baru + stok + URL tetap ada di Katalog tanpa internet!**
   - Minta Asprak refresh HP-nya (saat laptop masih offline) → di HP Asprak belum muncul karena laptop masih offline.
4. **Nyalakan kembali Wi-Fi laptop (ONLINE):**
   - Dalam 1–3 detik, tunjukkan status bar otomatis berubah **`Menyinkronkan 1 data offline ke server…`** lalu menjadi hijau **`1 data offline berhasil disinkronkan ke server Neon!`**, dan badge kuning pada produk otomatis hilang!
   - **Minta Asprak refresh HP-nya lagi** → **produk baru, jumlah stok, foto, dan link Shopee/Tokopedia langsung muncul sinkron di HP Asprak** (dan tercatat di **Stok Log**)!

Semoga responsinya lancar dan dapat nilai maksimal + nilai tambah dari kedua challenge ini! 💪
