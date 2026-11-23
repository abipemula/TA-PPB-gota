import { useState, useEffect, useCallback } from 'react'
import hardwareService from '../services/hardwareService'

// ---------------------------------------------------------------------------
// useHardware — Custom hook untuk mengambil daftar komponen komputer (Modul 5)
// ---------------------------------------------------------------------------
export function useHardware(params = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('api')

  const paramKey = JSON.stringify(params)

  const fetchHardware = useCallback(async () => {
    try {
      setLoading(true)
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
      setItems([])
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
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItem = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await hardwareService.getProductById(id)
      if (response.success) {
        setItem(response.data)
      } else {
        setError(response.message || 'Komponen tidak ditemukan.')
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail komponen.')
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  return { item, loading, error, refetch: fetchItem }
}
