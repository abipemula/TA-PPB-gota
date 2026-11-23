import { Plus, Cpu } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Katalog' },
  { id: 'StockLogs', label: 'Mutasi Stok' },
  { id: 'Favorites', label: 'Watchlist', hasBadge: true },
  { id: 'Warehouse', label: 'Rak & Supplier' },
  { id: 'Profile', label: 'Profil & About' },
]

function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div className="header-logo-badge">
          <Cpu size={20} color="#38bdf8" />
        </div>
        <div>
          <span className="brand display">RIGLOG</span>
          <span className="brand-tag">INVENTORY &amp; HARDWARE CATALOG</span>
        </div>
      </div>

      {/* Desktop Top Nav (tetap sinkron dengan Bottom Navigation Bar) */}
      <nav className="nav desktop-nav" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Tambah Komponen Baru ke Katalog"
        >
          <Plus size={15} /> Komponen Baru
        </button>
      )}
    </header>
  )
}

export default Header
