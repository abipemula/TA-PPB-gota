import { useState, useEffect, useCallback } from 'react'
import { getUserIdentifier } from '../services/userService'

const LOCAL_KEY = 'riglog_watchlist_favorites'

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
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
  const [loading] = useState(false)
  const [error] = useState(null)

  const refetch = useCallback(() => {
    setFavorites(readLocalFavs())
  }, [])

  useEffect(() => {
    const handleStorageUpdate = () => setFavorites(readLocalFavs())
    window.addEventListener('riglog-favs-updated', handleStorageUpdate)
    window.addEventListener('storage', handleStorageUpdate)
    return () => {
      window.removeEventListener('riglog-favs-updated', handleStorageUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [])

  return { favorites, loading, error, isLocal: true, refetch }
}

export function useToggleFavorite() {
  const toggleFavorite = async (productId) => {
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
  }

  return { toggleFavorite, loading: false, error: null }
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
    if (result) refetch()
    return result
  }

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export const removeFavorites = (productIds = []) => {
  const idSet = new Set(productIds.map((id) => String(id)))
  const current = readLocalFavs()
  const next = current.filter((fav) => {
    const favId =
      typeof fav === 'object' && fav !== null
        ? fav.id ?? fav.product_id ?? fav.recipe_id
        : fav
    return !idSet.has(String(favId))
  })
  writeLocalFavs(next)
  window.dispatchEvent(new Event('riglog-favs-updated'))
  return next
}

export { getUserIdentifier }
