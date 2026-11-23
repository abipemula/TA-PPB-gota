import { apiClient, IS_SUPABASE } from '../config/api'
import HARDWARE_ITEMS, {
  HARDWARE_CATEGORIES,
  HARDWARE_SUPPLIERS,
} from '../data/hardwareData'

const LOCAL_PRODUCTS_KEY = 'riglog_local_products_v1'

export const readLocalProducts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fallback
  }
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(HARDWARE_ITEMS))
  return [...HARDWARE_ITEMS]
}

export const writeLocalProducts = (items) => {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(items))
  } catch {
    // ignore quota error
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
  }
}

class HardwareService {
  async getProducts(params = {}) {
    try {
      if (IS_SUPABASE) {
        const queryParts = ['select=*']
        if (params.search) {
          queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
        }
        if (params.category && params.category !== 'All') {
          queryParts.push(
            `category_name=eq.${encodeURIComponent(params.category)}`,
          )
        }
        queryParts.push('order=created_at.desc')
        const data = await apiClient.get(
          `/rest/v1/products?${queryParts.join('&')}`,
        )
        const list = Array.isArray(data) ? data.map(normalizeProduct) : []
        writeLocalProducts(list)
        return { success: true, data: list, source: 'supabase' }
      }

      // Express REST API (Modul 1: /api/products)
      const data = await apiClient.get('/api/products', { params })
      const rawList = Array.isArray(data) ? data : data?.data || []
      const list = rawList.map(normalizeProduct)
      if (list.length > 0) writeLocalProducts(list)
      return { success: true, data: list, source: 'api' }
    } catch {
      const localList = readLocalProducts().map(normalizeProduct)
      return {
        success: true,
        data: localList,
        source: 'local',
      }
    }
  }

  async getProductById(id) {
    try {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          `/rest/v1/products?id=eq.${id}&select=*`,
        )
        if (Array.isArray(data) && data.length > 0) {
          return { success: true, data: normalizeProduct(data[0]) }
        }
      } else {
        const data = await apiClient.get(`/api/products/${id}`)
        const item = data?.data || data
        if (item && item.id) {
          return { success: true, data: normalizeProduct(item) }
        }
      }
    } catch {
      // Fallback ke penyimpanan lokal
    }

    const localList = readLocalProducts()
    const found = localList.find((item) => String(item.id) === String(id))
    if (found) {
      return { success: true, data: normalizeProduct(found) }
    }
    throw new Error('Komponen tidak ditemukan.')
  }

  async createProduct(data) {
    const specsArray = Array.isArray(data.ingredients)
      ? data.ingredients
      : Array.isArray(data.specs)
        ? data.specs
        : []

    const categoryName = data.category_name || data.type || 'Processor (CPU)'
    const payload = {
      sku:
        data.sku ||
        `HW-${Date.now().toString().slice(-5)}`,
      name: data.name,
      brand: data.brand || 'Official Brand',
      category_name: categoryName,
      price: Number(data.price || 0),
      stock: Number(data.stock ?? 10),
      min_stock: Number(data.min_stock ?? 5),
      rack_location: data.rack_location || 'Rak A-01',
      description: data.description || '',
      specs: specsArray,
      image_url: data.image_url || getCategoryIcon(categoryName),
      is_featured: Boolean(data.is_featured),
    }

    try {
      if (IS_SUPABASE) {
        const res = await apiClient.post('/rest/v1/products', payload, {
          headers: { Prefer: 'return=representation' },
        })
        const created = Array.isArray(res) ? res[0] : res
        return { success: true, data: normalizeProduct(created) }
      }

      const res = await apiClient.post('/api/products', payload)
      const created = normalizeProduct(res?.data || res)
      const currentLocal = readLocalProducts()
      writeLocalProducts([created, ...currentLocal])
      return { success: true, data: created }
    } catch {
      // Simpan ke localStorage bila API sedang tidak aktif
      const newLocalItem = normalizeProduct({
        id: `local-${Date.now()}`,
        ...payload,
        steps: data.steps || [],
        created_at: new Date().toISOString(),
      })
      const current = readLocalProducts()
      writeLocalProducts([newLocalItem, ...current])
      return { success: true, data: newLocalItem, isLocal: true }
    }
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
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.is_featured !== undefined && {
        is_featured: Boolean(data.is_featured),
      }),
    }

    // Selalu sinkronkan perubahan ke cache lokal
    const localList = readLocalProducts()
    const idx = localList.findIndex((p) => String(p.id) === String(id))
    if (idx !== -1) {
      localList[idx] = normalizeProduct({
        ...localList[idx],
        ...payload,
        steps: data.steps || localList[idx].steps,
      })
      writeLocalProducts(localList)
    }

    try {
      if (IS_SUPABASE) {
        const res = await apiClient.patch(
          `/rest/v1/products?id=eq.${id}`,
          payload,
          { headers: { Prefer: 'return=representation' } },
        )
        const updated = Array.isArray(res) ? res[0] : res
        return { success: true, data: normalizeProduct(updated) }
      }
      const res = await apiClient.put(`/api/products/${id}`, payload)
      return { success: true, data: normalizeProduct(res?.data || res) }
    } catch {
      if (idx !== -1) {
        return { success: true, data: localList[idx], isLocal: true }
      }
      throw new Error('Gagal memperbarui data komponen.')
    }
  }

  async deleteProduct(id) {
    const localList = readLocalProducts().filter(
      (p) => String(p.id) !== String(id),
    )
    writeLocalProducts(localList)

    try {
      if (IS_SUPABASE) {
        await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
        return { success: true }
      }
      await apiClient.delete(`/api/products/${id}`)
      return { success: true }
    } catch {
      return { success: true, isLocal: true }
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
}

export default new HardwareService()
