import { Bookmark } from 'lucide-react'
import { useIsFavorited } from '../../hooks/useFavorites'

export default function FavoriteButton({ itemId, onToggle }) {
  const { isFavorited, loading, toggleFavorite } = useIsFavorited(itemId)

  const handleClick = async (e) => {
    e.stopPropagation()
    const result = await toggleFavorite()
    if (result && onToggle) onToggle(result)
  }

  return (
    <button
      type="button"
      className={`fav-btn${isFavorited ? ' fav-btn--active' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={
        isFavorited ? 'Hapus dari Watchlist Stok' : 'Simpan ke Watchlist Stok'
      }
      title={
        isFavorited ? 'Hapus dari Watchlist Stok' : 'Simpan ke Watchlist Stok'
      }
    >
      <Bookmark
        size={17}
        fill={isFavorited ? 'var(--accent)' : 'none'}
        stroke={isFavorited ? 'var(--accent)' : 'var(--steel)'}
      />
    </button>
  )
}
