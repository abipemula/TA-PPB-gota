import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");

const genId = () => crypto.randomUUID();

export const DEFAULT_DATA = {
  categories: [
    {
      id: "11111111-1111-4111-8111-111111111101",
      name: "Processor (CPU)",
      slug: "cpu",
      aisle: "Lorong A - Rak 01",
      description:
        "Unit pemrosesan utama desktop & workstation (AMD Ryzen & Intel Core)",
    },
    {
      id: "11111111-1111-4111-8111-111111111102",
      name: "Graphics Card (GPU)",
      slug: "gpu",
      aisle: "Lorong A - Rak 02",
      description:
        "Kartu grafis gaming, rendering 3D, dan akselerasi AI (NVIDIA RTX & AMD Radeon)",
    },
    {
      id: "11111111-1111-4111-8111-111111111103",
      name: "Motherboard",
      slug: "motherboard",
      aisle: "Lorong B - Rak 01",
      description: "Papan induk ATX, Micro-ATX, dan Mini-ITX berbagai chipset",
    },
    {
      id: "11111111-1111-4111-8111-111111111104",
      name: "Memory (RAM)",
      slug: "ram",
      aisle: "Lorong B - Rak 02",
      description: "Modul memori DDR4 dan DDR5 performa tinggi dengan XMP/EXPO",
    },
    {
      id: "11111111-1111-4111-8111-111111111105",
      name: "Storage (SSD/NVMe)",
      slug: "storage",
      aisle: "Lorong C - Rak 01",
      description: "Penyimpanan NVMe PCIe Gen4/Gen5 M.2 dan SSD SATA Enterprise",
    },
    {
      id: "11111111-1111-4111-8111-111111111106",
      name: "Power Supply (PSU)",
      slug: "psu",
      aisle: "Lorong C - Rak 02",
      description: "Unit catu daya 80+ Gold/Platinum ATX 3.0 Full Modular",
    },
  ],
  suppliers: [
    {
      id: "22222222-2222-4222-8222-222222222201",
      name: "PT Nusantara Jaya Teknologi (NJT)",
      email: "supply@njt.co.id",
      phone: "021-6120998",
      address: "Mangga Dua Mall Lt. 4, Jakarta Pusat",
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      name: "PT Synnex Metrodata Indonesia",
      email: "b2b@metrodata.co.id",
      phone: "021-29345800",
      address: "APL Tower Lt. 42, Jakarta Barat",
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      name: "PT Alfa Artha Andhaya (AAA)",
      email: "distribusi@aaa.co.id",
      phone: "021-62301234",
      address: "Ruko Harco Mangga Dua Blok H, Jakarta",
    },
  ],
  products: [
    {
      id: "33333333-3333-4333-8333-333333333301",
      sku: "CPU-AMD-9800X3D",
      name: "AMD Ryzen 7 9800X3D",
      brand: "AMD",
      category_id: "11111111-1111-4111-8111-111111111101",
      category_name: "Processor (CPU)",
      price: 8450000,
      stock: 14,
      min_stock: 5,
      rack_location: "Rak A-01-B",
      description:
        "Prosesor gaming desktop tercepat dengan teknologi 2nd Gen AMD 3D V-Cache pada arsitektur Zen 5 (Socket AM5).",
      image_url: "/hardware/cpu.svg",
      specs: [
        { name: "Socket", quantity: "AM5 (LGA 1718)" },
        { name: "Cores / Threads", quantity: "8 Cores / 16 Threads" },
        { name: "Boost Clock", quantity: "Up to 5.2 GHz" },
        { name: "L3 Cache", quantity: "96 MB 3D V-Cache" },
        { name: "TDP", quantity: "120W" },
      ],
      is_featured: true,
      is_weekly_pick: true,
      is_bestseller: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      sku: "GPU-ASU-4070TIS",
      name: "ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB",
      brand: "ASUS ROG",
      category_id: "11111111-1111-4111-8111-111111111102",
      category_name: "Graphics Card (GPU)",
      price: 15890000,
      stock: 4,
      min_stock: 5,
      rack_location: "Rak A-02-A",
      description:
        "Kartu grafis kelas antusias dengan 16GB GDDR6X VRAM, pendingin Axial-tech 3 kipas, dan vapor chamber untuk gaming 4K & AI.",
      image_url: "/hardware/gpu.svg",
      specs: [
        { name: "VRAM", quantity: "16 GB GDDR6X" },
        { name: "Bus Interface", quantity: "PCIe 4.0 x16 (256-bit)" },
        { name: "Boost Clock", quantity: "2670 MHz (OC Mode)" },
        { name: "Power Connector", quantity: "1x 16-pin 12VHPWR" },
        { name: "Recommended PSU", quantity: "750W" },
      ],
      is_featured: true,
      is_weekly_pick: true,
      is_bestseller: true,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      sku: "MBD-MSI-B650TOM",
      name: "MSI MAG B650 Tomahawk WiFi",
      brand: "MSI",
      category_id: "11111111-1111-4111-8111-111111111103",
      category_name: "Motherboard",
      price: 3650000,
      stock: 19,
      min_stock: 6,
      rack_location: "Rak B-01-C",
      description:
        "Motherboard ATX AM5 tangguh dengan VRM 14+2+1 Duet Rail Power System, DDR5 7600+ MHz, 3x M.2 Gen4, dan Wi-Fi 6E.",
      image_url: "/hardware/motherboard.svg",
      specs: [
        { name: "Form Factor", quantity: "ATX (30.5 cm x 24.4 cm)" },
        { name: "Chipset", quantity: "AMD B650" },
        { name: "Memory Support", quantity: "4x DDR5 up to 192GB" },
        { name: "M.2 Slots", quantity: "3x PCIe 4.0 x4 M.2" },
        { name: "Networking", quantity: "2.5G LAN + Wi-Fi 6E" },
      ],
      is_featured: true,
      is_weekly_pick: false,
      is_bestseller: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333304",
      sku: "RAM-GSK-6400C32",
      name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000",
      brand: "G.Skill",
      category_id: "11111111-1111-4111-8111-111111111104",
      category_name: "Memory (RAM)",
      price: 2150000,
      stock: 3,
      min_stock: 8,
      rack_location: "Rak B-02-A",
      description:
        "Kit RAM DDR5 dual-channel dengan latensi rendah CL30, heatspreader aluminium brushed, dan dukungan profil AMD EXPO & Intel XMP 3.0.",
      image_url: "/hardware/ram.svg",
      specs: [
        { name: "Capacity", quantity: "32 GB (2 x 16 GB)" },
        { name: "Speed", quantity: "DDR5-6000 MT/s" },
        { name: "CAS Latency", quantity: "CL30-38-38-96" },
        { name: "Voltage", quantity: "1.35V" },
        { name: "Profile", quantity: "AMD EXPO & Intel XMP 3.0" },
      ],
      is_featured: true,
      is_weekly_pick: true,
      is_bestseller: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333305",
      sku: "SSD-SAM-990PRO2T",
      name: "Samsung 990 PRO 2TB NVMe PCIe 4.0 M.2",
      brand: "Samsung",
      category_id: "11111111-1111-4111-8111-111111111105",
      category_name: "Storage (SSD/NVMe)",
      price: 2980000,
      stock: 22,
      min_stock: 6,
      rack_location: "Rak C-01-A",
      description:
        "SSD NVMe M.2 flagship dengan kecepatan baca sekuensial hingga 7450 MB/s dan tulis 6900 MB/s, ideal untuk workstation dan PS5.",
      image_url: "/hardware/storage.svg",
      specs: [
        { name: "Capacity", quantity: "2 TB (2000 GB)" },
        { name: "Interface", quantity: "PCIe Gen 4.0 x4, NVMe 2.0" },
        { name: "Sequential Read", quantity: "7,450 MB/s" },
        { name: "Sequential Write", quantity: "6,900 MB/s" },
        { name: "DRAM Cache", quantity: "2GB LPDDR4" },
      ],
      is_featured: false,
      is_weekly_pick: true,
      is_bestseller: true,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333306",
      sku: "PSU-COR-RM850E",
      name: "Corsair RM850e (2025) 850W 80+ Gold ATX 3.0",
      brand: "Corsair",
      category_id: "11111111-1111-4111-8111-111111111106",
      category_name: "Power Supply (PSU)",
      price: 2090000,
      stock: 2,
      min_stock: 5,
      rack_location: "Rak C-02-B",
      description:
        "Power supply full modular bersertifikasi ATX 3.0 dan PCIe 5.0 dengan kabel 12VHPWR native, kapasitor 105°C, dan Zero RPM Fan Mode.",
      image_url: "/hardware/psu.svg",
      specs: [
        { name: "Wattage", quantity: "850 Watts" },
        { name: "Efficiency", quantity: "80 PLUS Gold / Cybenetics Platinum" },
        { name: "Modularity", quantity: "Fully Modular" },
        { name: "ATX Version", quantity: "ATX 3.0 & PCIe 5.0 Ready" },
        { name: "Warranty", quantity: "7 Tahun Resmi" },
      ],
      is_featured: true,
      is_weekly_pick: false,
      is_bestseller: false,
      created_at: new Date().toISOString(),
    },
  ],
  stock_logs: [
    {
      id: "44444444-4444-4444-8444-444444444401",
      product_id: "33333333-3333-4333-8333-333333333301",
      product_name: "AMD Ryzen 7 9800X3D",
      sku: "CPU-AMD-9800X3D",
      type: "IN",
      quantity: 10,
      previous_stock: 4,
      current_stock: 14,
      reference_no: "PO-2026-1101",
      operator: "Raka (Kepala Gudang)",
      supplier_name: "PT Nusantara Jaya Teknologi (NJT)",
      notes: "Restock batch awal November untuk rakitan PC Gaming High-End",
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
    {
      id: "44444444-4444-4444-8444-444444444402",
      product_id: "33333333-3333-4333-8333-333333333302",
      product_name: "ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB",
      sku: "GPU-ASU-4070TIS",
      type: "OUT",
      quantity: 2,
      previous_stock: 6,
      current_stock: 4,
      reference_no: "INV-2026-8821",
      operator: "Dimas (Teknisi Rakitan)",
      supplier_name: "Penjualan Toko / Custom Rig",
      notes: "Keluar 2 unit untuk pesanan PC Render Studio Arsitektur",
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: "44444444-4444-4444-8444-444444444403",
      product_id: "33333333-3333-4333-8333-333333333304",
      product_name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000",
      sku: "RAM-GSK-6400C32",
      type: "OUT",
      quantity: 5,
      previous_stock: 8,
      current_stock: 3,
      reference_no: "INV-2026-8840",
      operator: "Dimas (Teknisi Rakitan)",
      supplier_name: "Penjualan Toko / Upgrade",
      notes: "Stok menipis di bawah batas minimum (perlu PO baru)",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "44444444-4444-4444-8444-444444444404",
      product_id: "33333333-3333-4333-8333-333333333305",
      product_name: "Samsung 990 PRO 2TB NVMe PCIe 4.0 M.2",
      sku: "SSD-SAM-990PRO2T",
      type: "IN",
      quantity: 12,
      previous_stock: 10,
      current_stock: 22,
      reference_no: "PO-2026-1109",
      operator: "Raka (Kepala Gudang)",
      supplier_name: "PT Synnex Metrodata Indonesia",
      notes: "Penerimaan barang distributor resmi bergaransi 5 tahun",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ],
  reviews: [
    {
      id: "55555555-5555-4555-8555-555555555501",
      product_id: "33333333-3333-4333-8333-333333333301",
      user_identifier: "Raka (QC Gudang)",
      rating: 5,
      comment:
        "Segel box resmi utuh, batch produksi terbaru 2026, suhu uji beban normal.",
      created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    },
    {
      id: "55555555-5555-4555-8555-555555555502",
      product_id: "33333333-3333-4333-8333-333333333302",
      user_identifier: "Dimas (Teknisi Rakitan)",
      rating: 5,
      comment:
        "Tidak ada coil whine saat di-test FurMark 15 menit. Konektor 12VHPWR aman.",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  settings: {
    profile: {
      username: "Raka Pratama",
      role: "Kepala Inventaris & QC Gudang",
      storeBranch: "RigLog Hardware Hub — Cabang Utama",
      avatar: null,
      bio: "Bertanggung jawab atas pencatatan stok masuk/keluar, audit nomor seri (S/N), dan pengelolaan katalog komponen PC rakitan.",
    },
    brandLogos: {},
    navIcons: {},
    socialMedia: [
      {
        id: "instagram",
        name: "Instagram Prodi",
        handle: "@prodi_official",
        url: "https://www.instagram.com/",
      },
      {
        id: "youtube",
        name: "YouTube Prodi",
        handle: "Official Channel Prodi",
        url: "https://www.youtube.com/",
      },
      {
        id: "linkedin",
        name: "LinkedIn Prodi",
        handle: "Program Studi",
        url: "https://www.linkedin.com/",
      },
      {
        id: "website",
        name: "Website Resmi Prodi",
        handle: "portal.prodi.ac.id",
        url: "https://www.google.com/",
      },
    ],
  },
};

function loadInitialStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        categories: Array.isArray(parsed.categories)
          ? parsed.categories
          : [...DEFAULT_DATA.categories],
        suppliers: Array.isArray(parsed.suppliers)
          ? parsed.suppliers
          : [...DEFAULT_DATA.suppliers],
        products: Array.isArray(parsed.products)
          ? parsed.products
          : [...DEFAULT_DATA.products],
        stock_logs: Array.isArray(parsed.stock_logs)
          ? parsed.stock_logs
          : [...DEFAULT_DATA.stock_logs],
        reviews: Array.isArray(parsed.reviews)
          ? parsed.reviews
          : [...DEFAULT_DATA.reviews],
        settings: parsed.settings
          ? {
              profile: {
                ...DEFAULT_DATA.settings.profile,
                ...(parsed.settings.profile || {}),
              },
              brandLogos: parsed.settings.brandLogos || {},
              navIcons: parsed.settings.navIcons || {},
              socialMedia: Array.isArray(parsed.settings.socialMedia)
                ? parsed.settings.socialMedia
                : structuredClone(DEFAULT_DATA.settings.socialMedia),
            }
          : structuredClone(DEFAULT_DATA.settings),
      };
    }
  } catch (err) {
    console.warn("[RigLog API] Gagal membaca local-db.json, pakai default:", err.message);
  }

  // Buat file database lokal pertama kali di disk
  const fresh = structuredClone(DEFAULT_DATA);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), "utf-8");
  } catch (err) {
    console.warn("[RigLog API] Tidak bisa menulis local-db.json:", err.message);
  }
  return fresh;
}

const loaded = loadInitialStore();

export const memoryStore = {
  ...loaded,
  genId,
};

/**
 * Simpan seluruh perubahan database lokal ke disk (riglog-api/data/local-db.json)
 * agar data tetap tersimpan walaupun server / npm run dev di-restart.
 */
export function saveMemoryStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const snapshot = {
      categories: memoryStore.categories,
      suppliers: memoryStore.suppliers,
      products: memoryStore.products,
      stock_logs: memoryStore.stock_logs,
      reviews: memoryStore.reviews,
      settings: memoryStore.settings,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch (err) {
    console.warn("[RigLog API] Gagal menyimpan local-db.json:", err.message);
  }
}
