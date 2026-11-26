import { useState, useEffect, useCallback } from 'react'
import hardwareService, {
  getInitialProductsSnapshot,
} from '../services/hardwareService'

// ---------------------------------------------------------------------------
// useHardware — Custom hook untuk mengambil daftar komponen komputer (Modul 5)
// Mendukung Stale-While-Revalidate (in-memory + IndexedDB snapshot) agar gambar & harga
// tampil instan (0ms), produk offline tetap tampil setelah refresh, dan otomatis refresh saat sync.
// ---------------------------------------------------------------------------
export function useHardware(params = {}) {
  const [items, setItems] = useState(() => getInitialProductsSnapshot(params))
  const [loading, setLoading] = useState(
    () => getInitialProductsSnapshot(params).length === 0,
  )
  const [error, setError] = useState(null)
  const [source, setSource] = useState(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'api',
  )

  const paramKey = JSON.stringify(params)

  const fetchHardware = useCallback(async () => {
    const cachedSnapshot = getInitialProductsSnapshot(params)
    try {
      if (cachedSnapshot.length === 0) {
        setLoading(true)
      } else {
        setItems(cachedSnapshot)
      }
      setError(null)
      const response = await hardwareService.getProducts(params)
      if (response.success) {
        setItems(response.data || [])
        setSource(response.source || 'api')
      } else {
        setError(response.message || 'Gagal memuat katalog komponen.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat katalog.')
      setItems((prev) => (prev.length > 0 ? prev : []))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    fetchHardware()
  }, [fetchHardware])

  // Otomatis perbarui UI saat IndexedDB selesai hydrasi (refresh offline) atau selesai sync ke server
  useEffect(() => {
    const handleLocalRefresh = () => {
      const snap = getInitialProductsSnapshot(params)
      if (snap.length > 0) {
        setItems(snap)
        setLoading(false)
      }
    }
    const handleSynced = () => {
      fetchHardware()
    }
    window.addEventListener('riglog-offline-hydrated', handleLocalRefresh)
    window.addEventListener('riglog-offline-queue-changed', handleLocalRefresh)
    window.addEventListener('riglog-offline-synced', handleSynced)
    return () => {
      window.removeEventListener('riglog-offline-hydrated', handleLocalRefresh)
      window.removeEventListener('riglog-offline-queue-changed', handleLocalRefresh)
      window.removeEventListener('riglog-offline-synced', handleSynced)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchHardware, paramKey])

  return { items, loading, error, source, refetch: fetchHardware }
}

export function useHardwareById(id) {
  const [item, setItem] = useState(() => {
    if (!id) return null
    const snapshot = getInitialProductsSnapshot()
    return snapshot.find((p) => String(p.id) === String(id)) || null
  })
  const [loading, setLoading] = useState(() => !item)
  const [error, setError] = useState(null)

  const fetchItem = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      const snapshot = getInitialProductsSnapshot()
      const found = snapshot.find((p) => String(p.id) === String(id))
      if (!found) {
        setLoading(true)
      } else {
        setItem(found)
      }
      setError(null)
      const response = await hardwareService.getProductById(id)
      if (response.success) {
        setItem(response.data)
      } else {
        setError(response.message || 'Komponen tidak ditemukan.')
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail komponen.')
      setItem((prev) => prev || null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  return { item, loading, error, refetch: fetchItem }
}
