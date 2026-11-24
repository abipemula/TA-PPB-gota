import { useState, useEffect, useCallback } from 'react'
import hardwareService, {
  getInitialProductsSnapshot,
} from '../services/hardwareService'

// ---------------------------------------------------------------------------
// useHardware — Custom hook untuk mengambil daftar komponen komputer (Modul 5)
// Mendukung Stale-While-Revalidate (in-memory snapshot) agar gambar & harga tampil instan (0ms)
// saat berpindah halaman (Katalog <-> Watchlist), sambil tetap sinkron dari API.
// ---------------------------------------------------------------------------
export function useHardware(params = {}) {
  const [items, setItems] = useState(() => getInitialProductsSnapshot(params))
  const [loading, setLoading] = useState(
    () => getInitialProductsSnapshot(params).length === 0,
  )
  const [error, setError] = useState(null)
  const [source, setSource] = useState('api')

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
