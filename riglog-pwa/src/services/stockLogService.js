import { apiClient, IS_SUPABASE } from '../config/api'
import { INITIAL_STOCK_LOGS } from '../data/hardwareData'
import { readLocalProducts, writeLocalProducts } from './hardwareService'

const LOCAL_LOGS_KEY = 'riglog_stock_logs_v1'

export const readLocalLogs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fallback
  }
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(INITIAL_STOCK_LOGS))
  return [...INITIAL_STOCK_LOGS]
}

export const writeLocalLogs = (logs) => {
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs))
  } catch {
    // ignore quota error
  }
}

class StockLogService {
  async getStockLogs() {
    try {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          '/rest/v1/stock_logs?select=*&order=created_at.desc',
        )
        if (Array.isArray(data)) {
          writeLocalLogs(data)
          return { success: true, data, source: 'supabase' }
        }
      }
      const data = await apiClient.get('/api/stock-logs')
      const list = Array.isArray(data) ? data : data?.data || []
      if (list.length > 0) writeLocalLogs(list)
      return { success: true, data: list, source: 'api' }
    } catch {
      return {
        success: true,
        data: readLocalLogs(),
        source: 'local',
      }
    }
  }

  async createStockMovement(payload) {
    const type = (payload.type || 'IN').toUpperCase()
    const qty = Math.max(1, Number(payload.quantity || 1))

    // Update juga stok di localStorage agar UI langsung sinkron
    const products = readLocalProducts()
    const pIdx = products.findIndex(
      (p) => String(p.id) === String(payload.product_id),
    )
    let prevStock = Number(payload.previous_stock ?? 0)
    let nextStock = prevStock
    let productName = payload.product_name || 'Komponen Hardware'
    let sku = payload.sku || 'SKU-HW'

    if (pIdx !== -1) {
      prevStock = Number(products[pIdx].stock || 0)
      productName = products[pIdx].name
      sku = products[pIdx].sku
      if (type === 'IN') nextStock = prevStock + qty
      else if (type === 'OUT') nextStock = Math.max(0, prevStock - qty)
      else nextStock = qty

      products[pIdx] = { ...products[pIdx], stock: nextStock }
      writeLocalProducts(products)
    }

    try {
      const res = await apiClient.post('/api/stock-logs', {
        ...payload,
        type,
        quantity: qty,
      })
      const created = res?.data || res
      const currentLogs = readLocalLogs()
      writeLocalLogs([created, ...currentLogs])
      return { success: true, data: created }
    } catch {
      const localRecord = {
        id: `log-${Date.now()}`,
        product_id: payload.product_id,
        product_name: productName,
        sku,
        type,
        quantity: qty,
        previous_stock: prevStock,
        current_stock: nextStock,
        reference_no:
          payload.reference_no || `MUT-${Date.now().toString().slice(-5)}`,
        operator: payload.operator || 'Admin Gudang',
        supplier_name: payload.supplier_name || 'Internal Gudang RigLog',
        notes: payload.notes || 'Pencatatan mutasi stok gudang',
        created_at: new Date().toISOString(),
      }
      const currentLogs = readLocalLogs()
      writeLocalLogs([localRecord, ...currentLogs])
      return { success: true, data: localRecord, isLocal: true }
    }
  }
}

export default new StockLogService()
