import {
  Cpu,
  ArrowLeftRight,
  BookmarkCheck,
  Boxes,
  UserCheck,
} from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

const BOTTOM_TABS = [
  { id: 'Catalog', label: 'Katalog', icon: Cpu },
  { id: 'StockLogs', label: 'Stok Log', icon: ArrowLeftRight },
  { id: 'Favorites', label: 'Watchlist', icon: BookmarkCheck, hasBadge: true },
  { id: 'Warehouse', label: 'Gudang', icon: Boxes },
  { id: 'Profile', label: 'Profil/About', icon: UserCheck },
]

/**
 * BottomNav — Bottom Navigation Bar wajib sesuai ketentuan Tugas Akhir PPB.
 * Memudahkan navigasi cepat antar 5 halaman utama aplikasi RigLog.
 */
export default function BottomNav({ activeTab, onSelectTab }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation Bar">
      <div className="bottom-nav__inner">
        {BOTTOM_TABS.map((item) => {
          const IconComponent = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav__icon-wrap">
                <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                {item.hasBadge && favCount > 0 && (
                  <span className="bottom-nav__badge">{favCount}</span>
                )}
              </div>
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
