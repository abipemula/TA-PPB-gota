# RigLog API (Backend Web Service - Modul 1 PPB)

Backend RESTful API untuk **RigLog: Sistem inventaris terintegrasi untuk pencatatan, pemantauan stok, dan pengelolaan katalog komponen komputer pada toko hardware**.

Dibangun menggunakan **Node.js**, **Express.js**, dan **Supabase PostgreSQL** dengan pola arsitektur **MVC-like (`config`, `models`, `controllers`, `routes`)** sesuai Modul 1 Praktikum PPB.

## Cara Menjalankan
1. Install dependensi:
   ```bash
   npm install
   ```
2. (Opsional) Salin kredensial Supabase (`SUPABASE_URL` dan `SUPABASE_KEY`) ke file `.env`, lalu jalankan query pada `supabase_schema.sql` di SQL Editor Supabase.
   *Catatan: Jika `.env` belum diisi, server otomatis berjalan dalam **In-Memory Fallback Mode** dengan data komponen komputer siap pakai sehingga tidak akan crash saat diuji.*
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Server berjalan pada `http://localhost:3000`.
