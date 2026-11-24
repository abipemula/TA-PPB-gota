import { apiClient } from '../config/api'
import { INITIAL_STOCK_LOGS } from '../data/hardwareData'

const OFFLINE_LOGS_CACHE = 'riglog_offline_logs_cache_v2'

const readOfflineLogs = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_LOGS_CACHE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return INITIAL_STOCK_LOGS
}

const writeOfflineLogs = (logs) => {
  try {
    localStorage.setItem(OFFLINE_LOGS_CACHE, JSON.stringify(logs))
  } catch {
    // ignore quota error
  }
}

class StockLogService {
  async getStockLogs() {
    try {
      const data = await apiClient.get('/api/stock-logs')
      const list = Array.isArray(data) ? data : data?.data || []
      writeOfflineLogs(list)
      return { success: true, data: list, source: 'api' }
    } catch (err) {
      if (err?.isNetworkError) {
        return {
          success: true,
          data: readOfflineLogs(),
          source: 'offline',
          warning: err.message,
        }
      }
      throw err
    }
  }

  async createStockMovement(payload) {
    const type = (payload.type || 'IN').toUpperCase()
    const qty = Math.max(1, Number(payload.quantity || 1))

    const res = await apiClient.post('/api/stock-logs', {
      ...payload,
      type,
      quantity: qty,
    })
    const created = res?.data || res
    return { success: true, data: created }
  }
}

export default new StockLogService()
