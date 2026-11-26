import { useState, useEffect, useCallback } from 'react'
import stockLogService from '../services/stockLogService'

// ---------------------------------------------------------------------------
// useStockLogs — Custom hook untuk mengambil & mencatat mutasi stok gudang
// Otomatis ter-update saat cache IndexedDB offline selesai hydrasi atau selesai sinkronisasi.
// ---------------------------------------------------------------------------
export function useStockLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('api')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await stockLogService.getStockLogs()
      if (res.success) {
        setLogs(res.data || [])
        setSource(res.source || 'api')
      } else {
        setError(res.message || 'Gagal memuat riwayat mutasi stok.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat mutasi stok.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    const handleSyncEvents = () => {
      fetchLogs()
    }
    window.addEventListener('riglog-offline-hydrated', handleSyncEvents)
    window.addEventListener('riglog-offline-queue-changed', handleSyncEvents)
    window.addEventListener('riglog-offline-synced', handleSyncEvents)
    return () => {
      window.removeEventListener('riglog-offline-hydrated', handleSyncEvents)
      window.removeEventListener('riglog-offline-queue-changed', handleSyncEvents)
      window.removeEventListener('riglog-offline-synced', handleSyncEvents)
    }
  }, [fetchLogs])

  return { logs, loading, error, source, refetch: fetchLogs }
}

export function useCreateStockLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const recordMovement = async (payload) => {
    try {
      setLoading(true)
      setError(null)
      const res = await stockLogService.createStockMovement(payload)
      if (res.success) {
        return res.data
      }
      throw new Error(res.message || 'Gagal mencatat mutasi stok.')
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { recordMovement, loading, error }
}
