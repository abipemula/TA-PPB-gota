import { apiClient } from '../config/api'
import { INITIAL_STOCK_LOGS } from '../data/hardwareData'
import {
  getDiskCachedLogs,
  setDiskCachedLogs,
  enqueueOfflineOperation,
  mergePendingQueueIntoLogs,
} from './offlineSyncService'

const readOfflineLogs = () => getDiskCachedLogs() || INITIAL_STOCK_LOGS

class StockLogService {
  async getStockLogs() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: true,
        data: mergePendingQueueIntoLogs(readOfflineLogs()),
        source: 'offline',
      }
    }

    try {
      const data = await apiClient.get('/api/stock-logs')
      const list = Array.isArray(data) ? data : data?.data || []
      setDiskCachedLogs(list)
      return {
        success: true,
        data: mergePendingQueueIntoLogs(list),
        source: 'api',
      }
    } catch (err) {
      if (err?.isNetworkError) {
        return {
          success: true,
          data: mergePendingQueueIntoLogs(readOfflineLogs()),
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
    const normalizedPayload = {
      ...payload,
      type,
      quantity: qty,
    }

    const queueOfflineMovement = async () => {
      const tempLogId = `offline-log-${Date.now()}`
      await enqueueOfflineOperation({
        type: 'CREATE_STOCK_LOG',
        tempLogId,
        payload: normalizedPayload,
      })
      return {
        success: true,
        offlineQueued: true,
        data: {
          id: tempLogId,
          ...normalizedPayload,
          created_at: new Date().toISOString(),
          pendingSync: true,
        },
      }
    }

    if (
      String(payload.product_id || '').startsWith('offline-prod-') ||
      (typeof navigator !== 'undefined' && !navigator.onLine)
    ) {
      return queueOfflineMovement()
    }

    try {
      const res = await apiClient.post('/api/stock-logs', normalizedPayload)
      const created = res?.data || res
      return { success: true, data: created, offlineQueued: false }
    } catch (err) {
      if (err?.isNetworkError) {
        return queueOfflineMovement()
      }
      throw err
    }
  }
}

export default new StockLogService()
