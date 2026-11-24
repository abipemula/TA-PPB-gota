import { useMemo } from 'react'
import { Bookmark, Loader, AlertCircle, ArrowRight } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useHardware } from '../hooks/useHardware'
import HARDWARE_ITEMS from '../data/hardwareData'
import HardwareCard from '../components/hardware/HardwareCard'

/**
 * FavoritesPage — Halaman 3: Watchlist / Pantauan Stok Prioritas.
 * Menampilkan komponen yang ditandai untuk restock / pengadaan prioritas.
 * Menggunakan data live & in-memory cache dari API agar foto komponen terbaru langsung muncul realtime
 * tanpa flash gambar ilustrasi SVG default.
 */
export default function FavoritesPage({ onSelectHardware, onNavigateCatalog }) {
  const {
    favorites,
    loading: favLoading,
    error: favError,
    refetch,
  } = useFavorites()
  const { items: apiItems, loading: apiLoading } = useHardware()

  const allKnownHardware = useMemo(() => {
    const map = new Map()
    // Prioritaskan data live / in-memory cache dari server agar gambar asli langsung tampil
    if (apiItems.length > 0) {
      apiItems.forEach((item) => {
        if (item.id !== undefined && item.id !== null) {
          map.set(item.id, item)
          map.set(String(item.id), item)
        }
        if (item.name) map.set(item.name, item)
      })
      return map
    }

    // Hanya gunakan fallback statis jika fetch API sudah selesai namun hasil kosong (offline total)
    if (!apiLoading) {
      HARDWARE_ITEMS.forEach((item, idx) => {
        const id = item.id || `local-${idx}`
        const enriched = { ...item, id }
        map.set(id, enriched)
        map.set(String(id), enriched)
        if (item.name) map.set(item.name, enriched)
      })
    }
    return map
  }, [apiItems, apiLoading])

  const favoriteItems = useMemo(() => {
    const resolved = []
    const seen = new Set()

    favorites.forEach((fav) => {
      const id =
        typeof fav === 'object' && fav !== null
          ? fav.id || fav.product_id || fav.recipe_id
          : fav
      const match =
        allKnownHardware.get(id) ||
        allKnownHardware.get(String(id)) ||
        (fav?.name ? fav : null)

      if (match && !seen.has(match.id || match.name)) {
        seen.add(match.id || match.name)
        resolved.push(match)
      }
    })
    return resolved
  }, [favorites, allKnownHardware])

  const isLoading = (favLoading || apiLoading) && favoriteItems.length === 0

  return (
    <div className="fav-page">
      <section className="masthead">
        <h1 className="display">Watchlist &amp; Pantauan Stok Prioritas</h1>
        <p className="lede">
          Daftar komponen komputer favorit atau stok prioritas yang Anda tandai untuk dipantau ketersediaan dan harganya.
        </p>
      </section>

      <section className="fav-content">
        <div className="list-head">
          <h2>Komponen dalam Pantauan</h2>
          <span className="count">{favoriteItems.length} item ditandai</span>
        </div>

        {isLoading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat daftar pantauan stok…</p>
          </div>
        )}

        {!isLoading && favError && favoriteItems.length === 0 && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{favError}</p>
            <button
              type="button"
              className="btn btn--outline"
              onClick={refetch}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && favoriteItems.length === 0 && !favError && (
          <div className="state-box">
            <Bookmark size={36} stroke="var(--steel)" />
            <h3>Belum ada komponen di Watchlist</h3>
            <p className="lede">
              Buka halaman Katalog dan klik ikon Bookmark pada komponen untuk memantau ketersediaan stoknya di halaman ini.
            </p>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateCatalog}
                style={{ marginTop: '16px' }}
              >
                Jelajahi Katalog <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {favoriteItems.length > 0 && (
          <ul className="stock">
            {favoriteItems.map((item) => (
              <HardwareCard
                key={item.id || item.name}
                item={item}
                onSelect={onSelectHardware}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
