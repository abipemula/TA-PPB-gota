import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeProduct } from './hardwareService'

// ---------------------------------------------------------------------------
// FavoriteService — Daftar Watchlist / Pantauan Komponen Prioritas (Modul 5)
// ---------------------------------------------------------------------------
class FavoriteService {
  async getFavorites(userIdentifier) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/favorites?user_identifier=eq.${userIdentifier}&select=product_id,created_at,products(*)`,
      )
      const list = Array.isArray(data)
        ? data.map((fav) => {
            const prod = fav.products ? normalizeProduct(fav.products) : null
            return {
              ...(prod || {}),
              id: fav.product_id,
              product_id: fav.product_id,
              created_at: fav.created_at,
            }
          })
        : []
      return { success: true, data: list }
    }
    throw new Error('Gunakan localStorage untuk mode standar')
  }

  async toggleFavorite(data) {
    if (IS_SUPABASE) {
      const targetId = data.product_id || data.recipe_id || data.gun_id
      const userId = data.user_identifier

      const existing = await apiClient.get(
        `/rest/v1/favorites?product_id=eq.${targetId}&user_identifier=eq.${userId}&select=*`,
      )
      if (Array.isArray(existing) && existing.length > 0) {
        await apiClient.delete(
          `/rest/v1/favorites?product_id=eq.${targetId}&user_identifier=eq.${userId}`,
        )
        return { success: true, data: { is_favorited: false } }
      } else {
        await apiClient.post(
          '/rest/v1/favorites',
          { product_id: targetId, user_identifier: userId },
          { headers: { Prefer: 'return=minimal' } },
        )
        return { success: true, data: { is_favorited: true } }
      }
    }
    throw new Error('Fallback ke localStorage')
  }
}

export default new FavoriteService()
