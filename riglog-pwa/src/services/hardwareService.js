import { apiClient } from '../config/api'
import HARDWARE_ITEMS, {
  HARDWARE_CATEGORIES,
  HARDWARE_SUPPLIERS,
} from '../data/hardwareData'

const OFFLINE_PRODUCTS_CACHE = 'riglog_offline_products_cache_v2'

// In-memory cache tanpa batas kuota localStorage — agar pindah tab (Katalog <-> Watchlist)
// langsung menampilkan gambar asli & harga terbaru dalam 0ms (realtime)
let memoryProductsCache = null
let inFlightProductsPromise = null

const readStoredCacheOnly = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_PRODUCTS_CACHE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return null
}

const readOfflineCache = () => {
  if (Array.isArray(memoryProductsCache) && memoryProductsCache.length > 0) {
    return memoryProductsCache
  }
  return readStoredCacheOnly() || HARDWARE_ITEMS
}

const writeOfflineCache = (items) => {
  if (!Array.isArray(items)) return
  memoryProductsCache = items
  try {
    localStorage.setItem(OFFLINE_PRODUCTS_CACHE, JSON.stringify(items))
  } catch {
    // Abaikan jika gambar base64 melebihi kuota 5MB localStorage — memoryProductsCache tetap menyimpan utuh
  }
}

const filterProductsList = (list, params = {}) => {
  let result = Array.isArray(list) ? list : []
  if (params.category && params.category !== 'All') {
    const cat = String(params.category).toLowerCase()
    result = result.filter(
      (p) => (p.category_name || p.type || '').toLowerCase() === cat,
    )
  }
  if (params.search) {
    const q = String(params.search).toLowerCase()
    result = result.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q),
    )
  }
  return result
}

export const getCategoryIcon = (categoryName = '') => {
  const lower = categoryName.toLowerCase()
  if (lower.includes('gpu') || lower.includes('graphic')) return '/hardware/gpu.svg'
  if (lower.includes('motherboard') || lower.includes('board'))
    return '/hardware/motherboard.svg'
  if (lower.includes('ram') || lower.includes('memory')) return '/hardware/ram.svg'
  if (lower.includes('ssd') || lower.includes('storage') || lower.includes('nvme'))
    return '/hardware/storage.svg'
  if (lower.includes('psu') || lower.includes('power')) return '/hardware/psu.svg'
  return '/hardware/cpu.svg'
}

export const normalizeProduct = (item) => {
  if (!item) return null

  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Spesifikasi',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : [
          'Periksa keutuhan segel distributor resmi dan kemasan anti-statis (ESD).',
          'Cocokkan nomor seri (S/N) fisik komponen dengan sistem RigLog.',
        ]

  const categoryName =
    item.category_name ||
    item.categories?.name ||
    item.type ||
    item.category ||
    'Processor (CPU)'

  const defaultIcon = getCategoryIcon(categoryName)

  return {
    ...item,
    id: item.id,
    sku: item.sku || `SKU-${String(item.id || '001').slice(0, 6).toUpperCase()}`,
    name: item.name || 'Komponen Hardware',
    brand: item.brand || 'OEM Official',
    type: categoryName,
    category: categoryName,
    category_name: categoryName,
    price: Number(item.price ?? 0),
    stock: Number(item.stock ?? 0),
    min_stock: Number(item.min_stock ?? 5),
    rack_location: item.rack_location || 'Rak A-01',
    description: item.description || '',
    image_url: item.image_url || item.image || defaultIcon,
    image: item.image_url || item.image || defaultIcon,
    ingredients: specsList,
    specs: specsList,
    steps: stepsList,
    is_featured: Boolean(item.is_featured),
    is_weekly_pick: Boolean(item.is_weekly_pick),
    is_bestseller: Boolean(item.is_bestseller),
  }
}

/**
 * Mengembalikan snapshot produk terbaru yang sudah pernah di-load dari API (in-memory / localStorage).
 * Tidak mengembalikan data seed SVG lama agar tidak terjadi flash gambar default.
 */
export const getInitialProductsSnapshot = (params = {}) => {
  const source = memoryProductsCache || readStoredCacheOnly()
  if (!source || source.length === 0) return []
  return filterProductsList(source.map(normalizeProduct), params)
}

class HardwareService {
  /**
   * Selalu ambil data terbaru dari Express API (riglog-api).
   * In-memory cache & deduplikasi dipakai agar perpindahan tab (Katalog <-> Watchlist) instan 0ms.
   */
  async getProducts(params = {}) {
    const isUnfiltered =
      (!params.category || params.category === 'All') && !params.search

    try {
      let data
      if (isUnfiltered) {
        if (!inFlightProductsPromise) {
          inFlightProductsPromise = apiClient
            .get('/api/products')
            .finally(() => {
              inFlightProductsPromise = null
            })
        }
        data = await inFlightProductsPromise
      } else {
        data = await apiClient.get('/api/products', { params })
      }

      const rawList = Array.isArray(data) ? data : data?.data || []
      const list = rawList.map(normalizeProduct)
      if (isUnfiltered) {
        writeOfflineCache(list)
      }
      return { success: true, data: list, source: 'api' }
    } catch (err) {
      if (err?.isNetworkError) {
        const cached = filterProductsList(
          readOfflineCache().map(normalizeProduct),
          params,
        )
        return {
          success: true,
          data: cached,
          source: 'offline',
          warning: err.message,
        }
      }
      throw err
    }
  }

  async getProductById(id) {
    try {
      const data = await apiClient.get(`/api/products/${id}`)
      const item = data?.data || data
      if (item && item.id) {
        return { success: true, data: normalizeProduct(item) }
      }
      throw new Error('Komponen tidak ditemukan.')
    } catch (err) {
      if (err?.isNetworkError) {
        const found = readOfflineCache().find(
          (item) => String(item.id) === String(id),
        )
        if (found) return { success: true, data: normalizeProduct(found) }
      }
      throw err
    }
  }

  async createProduct(data) {
    const specsArray = Array.isArray(data.ingredients)
      ? data.ingredients
      : Array.isArray(data.specs)
        ? data.specs
        : []

    const categoryName = data.category_name || data.type || 'Processor (CPU)'
    const payload = {
      sku: data.sku || `HW-${Date.now().toString().slice(-5)}`,
      name: data.name,
      brand: data.brand || 'Official Brand',
      category_name: categoryName,
      price: Number(data.price || 0),
      stock: Number(data.stock ?? 0),
      min_stock: Number(data.min_stock ?? 5),
      rack_location: data.rack_location || 'Rak A-01',
      description: data.description || '',
      specs: specsArray,
      steps: Array.isArray(data.steps) ? data.steps : [],
      image_url: data.image_url || getCategoryIcon(categoryName),
      is_featured: Boolean(data.is_featured),
      is_weekly_pick: Boolean(data.is_weekly_pick),
      is_bestseller: Boolean(data.is_bestseller),
      operator: data.operator || 'Admin Gudang',
    }

    const res = await apiClient.post('/api/products', payload)
    const created = normalizeProduct(res?.data || res)
    if (Array.isArray(memoryProductsCache)) {
      writeOfflineCache([created, ...memoryProductsCache])
    }
    return { success: true, data: created }
  }

  async updateProduct(id, data) {
    const specsArray = Array.isArray(data.ingredients)
      ? data.ingredients
      : Array.isArray(data.specs)
        ? data.specs
        : undefined

    const payload = {
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.type !== undefined && { category_name: data.type }),
      ...(data.category_name !== undefined && {
        category_name: data.category_name,
      }),
      ...(data.price !== undefined && { price: Number(data.price) }),
      ...(data.stock !== undefined && { stock: Number(data.stock) }),
      ...(data.min_stock !== undefined && { min_stock: Number(data.min_stock) }),
      ...(data.rack_location !== undefined && {
        rack_location: data.rack_location,
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(specsArray !== undefined && { specs: specsArray }),
      ...(data.steps !== undefined && { steps: data.steps }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.is_featured !== undefined && {
        is_featured: Boolean(data.is_featured),
      }),
      ...(data.is_weekly_pick !== undefined && {
        is_weekly_pick: Boolean(data.is_weekly_pick),
      }),
      ...(data.is_bestseller !== undefined && {
        is_bestseller: Boolean(data.is_bestseller),
      }),
      ...(data.operator !== undefined && { operator: data.operator }),
    }

    const res = await apiClient.put(`/api/products/${id}`, payload)
    const updated = normalizeProduct(res?.data || res)
    if (Array.isArray(memoryProductsCache)) {
      writeOfflineCache(
        memoryProductsCache.map((p) =>
          String(p.id) === String(id) ? updated : p,
        ),
      )
    }
    return { success: true, data: updated }
  }

  async deleteProduct(id) {
    await apiClient.delete(`/api/products/${id}`)
    if (Array.isArray(memoryProductsCache)) {
      writeOfflineCache(
        memoryProductsCache.filter((p) => String(p.id) !== String(id)),
      )
    }
    return { success: true }
  }

  async checkout(payload) {
    const res = await apiClient.post('/api/checkout', payload)
    const receipt = res?.data || res
    if (Array.isArray(memoryProductsCache) && receipt) {
      const stockUpdates = new Map()
      if (Array.isArray(receipt.items) && receipt.items.length > 0) {
        receipt.items.forEach((entry) => {
          if (
            entry?.product_id !== undefined &&
            entry?.remaining_stock !== undefined
          ) {
            stockUpdates.set(
              String(entry.product_id),
              Number(entry.remaining_stock),
            )
          }
        })
      } else if (
        receipt.product_id !== undefined &&
        receipt.remaining_stock !== undefined
      ) {
        stockUpdates.set(
          String(receipt.product_id),
          Number(receipt.remaining_stock),
        )
      }

      if (stockUpdates.size > 0) {
        writeOfflineCache(
          memoryProductsCache.map((p) =>
            stockUpdates.has(String(p.id))
              ? { ...p, stock: stockUpdates.get(String(p.id)) }
              : p,
          ),
        )
      }
    }
    return { success: true, data: receipt }
  }

  updateCachedStock(productId, nextStock) {
    if (Array.isArray(memoryProductsCache)) {
      writeOfflineCache(
        memoryProductsCache.map((p) =>
          String(p.id) === String(productId)
            ? { ...p, stock: Number(nextStock) }
            : p,
        ),
      )
    }
  }

  async getCategories() {
    try {
      const res = await apiClient.get('/api/categories')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.length > 0 ? list : HARDWARE_CATEGORIES
    } catch {
      return HARDWARE_CATEGORIES
    }
  }

  async getSuppliers() {
    try {
      const res = await apiClient.get('/api/suppliers')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.length > 0 ? list : HARDWARE_SUPPLIERS
    } catch {
      return HARDWARE_SUPPLIERS
    }
  }

  async createSupplier(payload) {
    const res = await apiClient.post('/api/suppliers', payload)
    return res?.data || res
  }
}

export default new HardwareService()
