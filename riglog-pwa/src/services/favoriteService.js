// ---------------------------------------------------------------------------
// FavoriteService — Daftar Watchlist Pribadi Pengunjung di perangkat lokal
// ---------------------------------------------------------------------------
class FavoriteService {
  async getFavorites() {
    throw new Error('Watchlist pribadi dikelola di localStorage browser pengguna')
  }

  async toggleFavorite() {
    throw new Error('Watchlist pribadi dikelola di localStorage browser pengguna')
  }
}

export default new FavoriteService()
