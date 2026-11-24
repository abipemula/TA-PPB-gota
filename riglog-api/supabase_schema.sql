-- =========================================================================
-- SKEMA DATABASE SUPABASE UNTUK RIGLOG (SESUAI MODUL 1 BAB II)
-- Salin SELURUH query ini ke SQL Editor Supabase -> klik "RUN"
-- =========================================================================

-- 1. Tabel Categories (Kategori Komponen PC & Lokasi Rak)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  aisle text,
  description text,
  created_at timestamptz default now()
);

-- 2. Tabel Suppliers (Distributor / Pemasok Gudang)
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

-- 3. Tabel Products (Katalog & Stok Komponen Komputer)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  brand text default 'Generic',
  category_id uuid references categories(id) on delete set null,
  category_name text default 'Processor (CPU)',
  price numeric(12,2) default 0,
  stock integer default 0,
  min_stock integer default 5,
  rack_location text default 'Rak A-01',
  description text,
  image_url text,
  specs jsonb default '[]'::jsonb,
  steps jsonb default '[]'::jsonb,
  is_featured boolean default false,
  is_weekly_pick boolean default false,
  is_bestseller boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabel Stock Logs (Riwayat Pencatatan Stok Masuk / Keluar Gudang)
create table if not exists stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text,
  sku text,
  type text not null check (type in ('IN', 'OUT', 'AUDIT')),
  quantity integer not null,
  previous_stock integer default 0,
  current_stock integer default 0,
  reference_no text,
  operator text default 'Admin Gudang',
  supplier_name text,
  notes text,
  created_at timestamptz default now()
);

-- 5. Tabel App Settings (Profil Admin, Logo Brand, Ikon Navbar, Sosmed Prodi)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================================
-- DATA AWAL (SEED DATA) AGAR TABEL LANGSUNG TERISI SAAT DIUJI
-- =========================================================================

insert into categories (id, name, slug, aisle, description) values
  ('11111111-1111-4111-8111-111111111101', 'Processor (CPU)', 'cpu', 'Lorong A - Rak 01', 'Unit pemrosesan utama desktop & workstation (AMD Ryzen & Intel Core)'),
  ('11111111-1111-4111-8111-111111111102', 'Graphics Card (GPU)', 'gpu', 'Lorong A - Rak 02', 'Kartu grafis gaming, rendering 3D, dan akselerasi AI (NVIDIA RTX & AMD Radeon)'),
  ('11111111-1111-4111-8111-111111111103', 'Motherboard', 'motherboard', 'Lorong B - Rak 01', 'Papan induk ATX, Micro-ATX, dan Mini-ITX berbagai chipset'),
  ('11111111-1111-4111-8111-111111111104', 'Memory (RAM)', 'ram', 'Lorong B - Rak 02', 'Modul memori DDR4 dan DDR5 performa tinggi dengan XMP/EXPO'),
  ('11111111-1111-4111-8111-111111111105', 'Storage (SSD/NVMe)', 'storage', 'Lorong C - Rak 01', 'Penyimpanan NVMe PCIe Gen4/Gen5 M.2 dan SSD SATA Enterprise'),
  ('11111111-1111-4111-8111-111111111106', 'Power Supply (PSU)', 'psu', 'Lorong C - Rak 02', 'Unit catu daya 80+ Gold/Platinum ATX 3.0 Full Modular')
on conflict (id) do nothing;

insert into suppliers (id, name, email, phone, address) values
  ('22222222-2222-4222-8222-222222222201', 'PT Nusantara Jaya Teknologi (NJT)', 'supply@njt.co.id', '021-6120998', 'Mangga Dua Mall Lt. 4, Jakarta Pusat'),
  ('22222222-2222-4222-8222-222222222202', 'PT Synnex Metrodata Indonesia', 'b2b@metrodata.co.id', '021-29345800', 'APL Tower Lt. 42, Jakarta Barat'),
  ('22222222-2222-4222-8222-222222222203', 'PT Alfa Artha Andhaya (AAA)', 'distribusi@aaa.co.id', '021-62301234', 'Ruko Harco Mangga Dua Blok H, Jakarta')
on conflict (id) do nothing;

insert into products (id, sku, name, brand, category_id, category_name, price, stock, min_stock, rack_location, description, image_url, specs, steps, is_featured, is_weekly_pick, is_bestseller) values
  (
    '33333333-3333-4333-8333-333333333301',
    'CPU-AMD-9800X3D',
    'AMD Ryzen 7 9800X3D',
    'AMD',
    '11111111-1111-4111-8111-111111111101',
    'Processor (CPU)',
    8450000,
    14,
    5,
    'Rak A-01-B',
    'Prosesor gaming desktop tercepat dengan teknologi 2nd Gen AMD 3D V-Cache pada arsitektur Zen 5 (Socket AM5).',
    '/hardware/cpu.svg',
    '[{"name":"Socket","quantity":"AM5 (LGA 1718)"},{"name":"Cores / Threads","quantity":"8 Cores / 16 Threads"},{"name":"Boost Clock","quantity":"Up to 5.2 GHz"},{"name":"L3 Cache","quantity":"96 MB 3D V-Cache"},{"name":"TDP","quantity":"120W"}]'::jsonb,
    '["Cek keutuhan segel hologram distributor resmi pada kemasan.","Cocokkan nomor seri (S/N) fisik dengan label kotak.","Simpan pada Rak A-01-B dengan kelembapan terkontrol."]'::jsonb,
    true, true, true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'GPU-ASU-4070TIS',
    'ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB',
    'ASUS ROG',
    '11111111-1111-4111-8111-111111111102',
    'Graphics Card (GPU)',
    15890000,
    4,
    5,
    'Rak A-02-A',
    'Kartu grafis kelas antusias dengan 16GB GDDR6X VRAM, pendingin Axial-tech 3 kipas, dan vapor chamber untuk gaming 4K & AI.',
    '/hardware/gpu.svg',
    '[{"name":"VRAM","quantity":"16 GB GDDR6X"},{"name":"Bus Interface","quantity":"PCIe 4.0 x16 (256-bit)"},{"name":"Boost Clock","quantity":"2670 MHz (OC Mode)"},{"name":"Power Connector","quantity":"1x 16-pin 12VHPWR"},{"name":"Recommended PSU","quantity":"750W"}]'::jsonb,
    '["Periksa segel anti-statis ESD dan kelengkapan adapter 12VHPWR.","Pastikan pelindung pin PCIe x16 terpasang lengkap."]'::jsonb,
    true, true, true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'MBD-MSI-B650TOM',
    'MSI MAG B650 Tomahawk WiFi',
    'MSI',
    '11111111-1111-4111-8111-111111111103',
    'Motherboard',
    3650000,
    19,
    6,
    'Rak B-01-C',
    'Motherboard ATX AM5 tangguh dengan VRM 14+2+1 Duet Rail Power System, DDR5 7600+ MHz, 3x M.2 Gen4, dan Wi-Fi 6E.',
    '/hardware/motherboard.svg',
    '[{"name":"Form Factor","quantity":"ATX (30.5 cm x 24.4 cm)"},{"name":"Chipset","quantity":"AMD B650"},{"name":"Memory Support","quantity":"4x DDR5 up to 192GB"},{"name":"M.2 Slots","quantity":"3x PCIe 4.0 x4 M.2"},{"name":"Networking","quantity":"2.5G LAN + Wi-Fi 6E"}]'::jsonb,
    '["Inspeksi visual pelindung soket LGA1718 AM5.","Pastikan antena Wi-Fi 6E dan kabel SATA tersedia."]'::jsonb,
    true, false, true
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'RAM-GSK-6400C32',
    'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000',
    'G.Skill',
    '11111111-1111-4111-8111-111111111104',
    'Memory (RAM)',
    2150000,
    3,
    8,
    'Rak B-02-A',
    'Kit RAM DDR5 dual-channel dengan latensi rendah CL30, heatspreader aluminium brushed, dan dukungan profil AMD EXPO & Intel XMP 3.0.',
    '/hardware/ram.svg',
    '[{"name":"Capacity","quantity":"32 GB (2 x 16 GB)"},{"name":"Speed","quantity":"DDR5-6000 MT/s"},{"name":"CAS Latency","quantity":"CL30-38-38-96"},{"name":"Voltage","quantity":"1.35V"},{"name":"Profile","quantity":"AMD EXPO & Intel XMP 3.0"}]'::jsonb,
    '["Verifikasi nomor seri berurutan (matched pair) pada kedua modul RAM."]'::jsonb,
    true, true, false
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    'SSD-SAM-990PRO2T',
    'Samsung 990 PRO 2TB NVMe PCIe 4.0 M.2',
    'Samsung',
    '11111111-1111-4111-8111-111111111105',
    'Storage (SSD/NVMe)',
    2980000,
    22,
    6,
    'Rak C-01-A',
    'SSD NVMe M.2 flagship dengan kecepatan baca sekuensial hingga 7450 MB/s dan tulis 6900 MB/s, ideal untuk workstation dan PS5.',
    '/hardware/storage.svg',
    '[{"name":"Capacity","quantity":"2 TB (2000 GB)"},{"name":"Interface","quantity":"PCIe Gen 4.0 x4, NVMe 2.0"},{"name":"Sequential Read","quantity":"7,450 MB/s"},{"name":"Sequential Write","quantity":"6,900 MB/s"},{"name":"DRAM Cache","quantity":"2GB LPDDR4"}]'::jsonb,
    '["Cek segel keamanan Samsung di kedua sisi kemasan."]'::jsonb,
    false, true, true
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    'PSU-COR-RM850E',
    'Corsair RM850e (2025) 850W 80+ Gold ATX 3.0',
    'Corsair',
    '11111111-1111-4111-8111-111111111106',
    'Power Supply (PSU)',
    2090000,
    2,
    5,
    'Rak C-02-B',
    'Power supply full modular bersertifikasi ATX 3.0 dan PCIe 5.0 dengan kabel 12VHPWR native, kapasitor 105°C, dan Zero RPM Fan Mode.',
    '/hardware/psu.svg',
    '[{"name":"Wattage","quantity":"850 Watts"},{"name":"Efficiency","quantity":"80 PLUS Gold / Cybenetics Platinum"},{"name":"Modularity","quantity":"Fully Modular"},{"name":"ATX Version","quantity":"ATX 3.0 & PCIe 5.0 Ready"},{"name":"Warranty","quantity":"7 Tahun Resmi"}]'::jsonb,
    '["Pastikan plastik wrap vakum utuh dan kabel AC power EU Plug disertakan."]'::jsonb,
    true, false, false
  )
on conflict (sku) do nothing;

insert into stock_logs (id, product_id, product_name, sku, type, quantity, previous_stock, current_stock, reference_no, operator, supplier_name, notes, created_at) values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'AMD Ryzen 7 9800X3D',
    'CPU-AMD-9800X3D',
    'IN',
    10,
    4,
    14,
    'PO-2026-1101',
    'Raka (Kepala Gudang)',
    'PT Nusantara Jaya Teknologi (NJT)',
    'Restock batch awal November untuk rakitan PC Gaming High-End',
    now() - interval '3 days'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333302',
    'ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB',
    'GPU-ASU-4070TIS',
    'OUT',
    2,
    6,
    4,
    'INV-2026-8821',
    'Dimas (Teknisi Rakitan)',
    'Penjualan Toko / Custom Rig',
    'Keluar 2 unit untuk pesanan PC Render Studio Arsitektur',
    now() - interval '2 days'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333304',
    'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000',
    'RAM-GSK-6400C32',
    'OUT',
    5,
    8,
    3,
    'INV-2026-8840',
    'Dimas (Teknisi Rakitan)',
    'Penjualan Toko / Upgrade',
    'Stok menipis di bawah batas minimum (perlu PO baru)',
    now() - interval '1 day'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333305',
    'Samsung 990 PRO 2TB NVMe PCIe 4.0 M.2',
    'SSD-SAM-990PRO2T',
    'IN',
    12,
    10,
    22,
    'PO-2026-1109',
    'Raka (Kepala Gudang)',
    'PT Synnex Metrodata Indonesia',
    'Penerimaan barang distributor resmi bergaransi 5 tahun',
    now() - interval '6 hours'
  )
on conflict (id) do nothing;
