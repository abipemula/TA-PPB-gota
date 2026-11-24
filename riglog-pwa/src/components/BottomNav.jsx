import { useState, useEffect } from 'react'
import {
  Cpu,
  ArrowLeftRight,
  BookmarkCheck,
  Boxes,
  UserCheck,
  Store,
  ClipboardList,
  Heart,
  Warehouse,
  User,
  LayoutGrid,
  History,
  Star,
  Package,
  Shield,
} from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import settingsService, { readCachedSettings } from '../services/settingsService'

// Peta pilihan ikon bawaan (bisa dipilih dari Panel Admin atau diubah langsung di sini)
export const NAV_ICON_CATALOG = {
  Cpu,
  Store,
  LayoutGrid,
  ArrowLeftRight,
  ClipboardList,
  History,
  BookmarkCheck,
  Heart,
  Star,
  Boxes,
  Warehouse,
  Package,
  UserCheck,
  User,
  Shield,
}

export const BOTTOM_TABS = [
  { id: 'Catalog', label: 'Katalog', defaultIcon: 'Cpu' },
  { id: 'StockLogs', label: 'Stok Log', defaultIcon: 'ArrowLeftRight' },
  { id: 'Favorites', label: 'Watchlist', defaultIcon: 'BookmarkCheck', hasBadge: true },
  { id: 'Warehouse', label: 'Gudang', defaultIcon: 'Boxes' },
  { id: 'Profile', label: 'Profil/About', defaultIcon: 'UserCheck' },
]

/**
 * BottomNav — Bottom Navigation Bar utama (5 menu).
 * Mendukung kustomisasi ikon lewat Mode Admin (pilih ikon Lucide atau upload gambar)
 * maupun edit langsung pada BOTTOM_TABS di file ini.
 */
export default function BottomNav({ activeTab, onSelectTab }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0
  const [navIcons, setNavIcons] = useState(
    () => readCachedSettings().navIcons || {},
  )

  useEffect(() => {
    const loadIcons = () => {
      settingsService.getSettings().then((res) => {
        if (res?.success && res.data?.navIcons) {
          setNavIcons(res.data.navIcons)
        }
      })
    }
    loadIcons()
    window.addEventListener('riglog-settings-updated', loadIcons)
    return () =>
      window.removeEventListener('riglog-settings-updated', loadIcons)
  }, [])

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation Bar">
      <div className="bottom-nav__inner">
        {BOTTOM_TABS.map((item) => {
          const customVal = navIcons[item.id]
          const isImageIcon =
            typeof customVal === 'string' &&
            (customVal.startsWith('http') ||
              customVal.startsWith('/') ||
              customVal.startsWith('data:image'))
          const IconComponent =
            (!isImageIcon && customVal && NAV_ICON_CATALOG[customVal]) ||
            NAV_ICON_CATALOG[item.defaultIcon] ||
            Cpu
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
                {isImageIcon ? (
                  <img
                    src={customVal}
                    alt={item.label}
                    className="bottom-nav__custom-img"
                  />
                ) : (
                  <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                )}
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
