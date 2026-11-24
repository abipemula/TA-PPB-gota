import { apiClient } from '../config/api'
import HARDWARE_ITEMS, {
  HARDWARE_CATEGORIES,
  HARDWARE_SUPPLIERS,
} from '../data/hardwareData'

const OFFLINE_PRODUCTS_CACHE = 'riglog_offline_products_cache_v2'

const readOfflineCache = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_PRODUCTS_CACHE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return HARDWARE_ITEMS
}

const writeOfflineCache = (items) => {
  try {
    localStorage.setItem(OFFLINE_PRODUCTS_CACHE, JSON.stringify(items))
  } catch {
    // ignore quota errors
  }
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

class HardwareService {
  /**
   * Selalu ambil data terbaru dari Express API (riglog-api).
   * Cache lokal hanya dipakai saat offline / backend tidak terjangkau.
   */
  async getProducts(params = {}) {
    try {
      const data = await apiClient.get('/api/products', { params })
      const rawList = Array.isArray(data) ? data : data?.data || []
      const list = rawList.map(normalizeProduct)
      writeOfflineCache(list)
      return { success: true, data: list, source: 'api' }
    } catch (err) {
      if (err?.isNetworkError) {
        const cached = readOfflineCache().map(normalizeProduct)
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
    return { success: true, data: normalizeProduct(res?.data || res) }
  }

  async deleteProduct(id) {
    await apiClient.delete(`/api/products/${id}`)
    return { success: true }
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
