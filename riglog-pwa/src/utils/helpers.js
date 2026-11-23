// ---------------------------------------------------------------------------
// helpers.js — pure utility functions used across RigLog PWA (Modul 5)
// ---------------------------------------------------------------------------

/**
 * Format angka menjadi mata uang Rupiah (contoh: "Rp 8.450.000").
 */
export const formatPrice = (price) => {
  const num = Number(price)
  if (Number.isNaN(num)) return 'Rp 0'
  return `Rp ${num.toLocaleString('id-ID')}`
}

/**
 * Format tanggal ISO ke bahasa Indonesia yang mudah dibaca.
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

/**
 * Pencarian teks client-side (nama, SKU, brand, deskripsi, atau lokasi rak).
 */
export const matchesSearch = (item, query) => {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    (item.name || '').toLowerCase().includes(q) ||
    (item.sku || '').toLowerCase().includes(q) ||
    (item.brand || '').toLowerCase().includes(q) ||
    (item.rack_location || '').toLowerCase().includes(q) ||
    (item.description || '').toLowerCase().includes(q)
  )
}

/**
 * Filter kategori komponen.
 */
export const matchesCategory = (item, category) => {
  if (!category || category === 'All') return true
  const itemCat = item.category_name || item.type || item.category || ''
  return itemCat.toLowerCase() === category.toLowerCase()
}

/**
 * Filter brand manufaktur (untuk fitur Shop by Brand).
 */
export const matchesBrand = (item, brand) => {
  if (!brand || brand === 'All') return true
  return (item.brand || '').toLowerCase() === brand.toLowerCase()
}

/**
 * Filter status stok (All, low = stok menipis, safe = stok aman).
 */
export const matchesStockStatus = (item, statusFilter) => {
  if (!statusFilter || statusFilter === 'all') return true
  const stock = Number(item.stock ?? 0)
  const minStock = Number(item.min_stock ?? 5)
  if (statusFilter === 'low') return stock <= minStock
  if (statusFilter === 'safe') return stock > minStock
  return true
}

/**
 * Urutkan array komponen berdasarkan key ('name', 'price', 'stock') dan order ('asc', 'desc').
 */
export const sortItems = (items, key = 'name', order = 'asc') => {
  const sorted = [...items].sort((a, b) => {
    if (key === 'price' || key === 'stock') {
      return (Number(a[key]) || 0) - (Number(b[key]) || 0)
    }
    return String(a[key] || '').localeCompare(String(b[key] || ''))
  })
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * Potong teks panjang dengan elipsis.
 */
export const truncate = (str, max = 100) => {
  if (!str || str.length <= max) return str || ''
  return str.slice(0, max).trimEnd() + '…'
}

/**
 * Ekstrak daftar kategori unik dari array produk.
 */
export const extractCategories = (items) => {
  const set = new Set([
    'Processor (CPU)',
    'Graphics Card (GPU)',
    'Motherboard',
    'Memory (RAM)',
    'Storage (SSD/NVMe)',
    'Power Supply (PSU)',
  ])
  items.forEach((i) => {
    const cat = i.category_name || i.type || i.category
    if (cat) set.add(cat)
  })
  return ['All', ...Array.from(set)]
}

/**
 * Hitung rata-rata rating audit/review komponen.
 */
export const averageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
  return Math.round((sum / reviews.length) * 10) / 10
}
