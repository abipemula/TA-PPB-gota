import { useState, useEffect, useCallback } from 'react'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'

const LOCAL_KEY = 'riglog_watchlist_favorites'

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
    // Default 2 komponen prioritas agar halaman Pantauan langsung terisi contoh
    const initial = [
      '33333333-3333-4333-8333-333333333302',
      '33333333-3333-4333-8333-333333333304',
    ]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(initial))
    return initial
  } catch {
    return []
  }
}

const writeLocalFavs = (ids) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => readLocalFavs())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLocal, setIsLocal] = useState(true)
  const userIdentifier = getUserIdentifier()

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await favoriteService.getFavorites(userIdentifier)
      if (response.success) {
        setFavorites(response.data || [])
        setIsLocal(false)
      } else {
        throw new Error(response.message)
      }
    } catch {
      setFavorites(readLocalFavs())
      setIsLocal(true)
    } finally {
      setLoading(false)
    }
  }, [userIdentifier])

  useEffect(() => {
    fetchFavorites()
    const handleStorageUpdate = () => setFavorites(readLocalFavs())
    window.addEventListener('riglog-favs-updated', handleStorageUpdate)
    return () =>
      window.removeEventListener('riglog-favs-updated', handleStorageUpdate)
  }, [fetchFavorites])

  return { favorites, loading, error, isLocal, refetch: fetchFavorites }
}

export function useToggleFavorite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const toggleFavorite = async (productId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await favoriteService.toggleFavorite({
        product_id: productId,
        user_identifier: userIdentifier,
      })
      if (response.success) {
        window.dispatchEvent(new Event('riglog-favs-updated'))
        return response.data
      }
      throw new Error(response.message)
    } catch {
      const current = readLocalFavs()
      const idx = current.findIndex((id) => String(id) === String(productId))
      let isFavorited
      if (idx === -1) {
        current.push(productId)
        isFavorited = true
      } else {
        current.splice(idx, 1)
        isFavorited = false
      }
      writeLocalFavs(current)
      window.dispatchEvent(new Event('riglog-favs-updated'))
      return { is_favorited: isFavorited }
    } finally {
      setLoading(false)
    }
  }

  return { toggleFavorite, loading, error }
}

export function useIsFavorited(productId) {
  const { favorites, loading: fetchLoading, refetch } = useFavorites()
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite()

  const isFavorited = favorites.some((fav) => {
    const favId =
      typeof fav === 'object' && fav !== null
        ? fav.id ?? fav.product_id ?? fav.recipe_id
        : fav
    return String(favId) === String(productId)
  })

  const toggleFavorite = async () => {
    const result = await toggle(productId)
    if (result) await refetch()
    return result
  }

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export { getUserIdentifier }
