// =========================================================================
// SITE & CONTACT CONFIGURATION (EDIT LEWAT KODE SAJA)
// Ubah informasi kontak toko/gudang, alamat, dan tautan media sosial prodi
// langsung di file ini agar layout footer tetap rapi dan konsisten.
// =========================================================================

export const SITE_CONFIG = {
  brandName: 'RIGLOG',
  tagline: 'Sistem Inventaris Gudang & Katalog Komponen Komputer',
  description:
    'Platform terintegrasi untuk pencatatan mutasi stok masuk/keluar, pemantauan rak gudang, dan pengelolaan katalog perangkat keras PC.',

  // Informasi Kontak Toko & Gudang (Edit manual di sini)
  contact: {
    whatsapp: '0812-3456-7890',
    whatsappUrl: 'https://wa.me/6281234567890',
    email: 'inventaris@riglog-hardware.id',
    phone: '(024) 7460053',
    address: 'Jl. Prof. Soedarto, S.H., Tembalang, Semarang, Jawa Tengah 50275',
    operationalHours: 'Senin – Sabtu, 08:30 – 17:00 WIB',
  },

  // Tautan Media Sosial Program Studi (Edit URL & label langsung di sini)
  socialMedia: [
    {
      id: 'instagram',
      name: 'Instagram Prodi',
      handle: '@prodi_official',
      url: 'https://www.instagram.com/',
    },
    {
      id: 'youtube',
      name: 'YouTube Prodi',
      handle: 'Official Channel Prodi',
      url: 'https://www.youtube.com/',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Prodi',
      handle: 'Program Studi',
      url: 'https://www.linkedin.com/',
    },
    {
      id: 'website',
      name: 'Website Resmi Prodi',
      handle: 'portal.prodi.ac.id',
      url: 'https://www.google.com/',
    },
  ],

  copyright: '© 2026 RigLog Hardware Inventory — Tugas Akhir Praktikum PPB.',
}

// Default logo brand untuk section "Shop by Brand"
// Kamu bisa ganti path di sini atau langsung upload gambar logo di UI.
export const BRAND_LOGOS = {
  AMD: '/brands/amd.svg',
  'ASUS ROG': '/brands/asus-rog.svg',
  MSI: '/brands/msi.svg',
  'G.Skill': '/brands/gskill.svg',
  Samsung: '/brands/samsung.svg',
  Corsair: '/brands/corsair.svg',
}
