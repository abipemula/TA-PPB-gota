import { useState, useMemo, useRef, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  PackageOpen,
  Cpu,
  AlertTriangle,
  Boxes,
  Wallet,
  Sparkles,
  Flame,
  Award,
  Tag,
  X,
} from 'lucide-react'
import { useHardware } from '../hooks/useHardware'
import { BRAND_LOGOS } from '../config/siteConfig'
import settingsService, { readCachedSettings } from '../services/settingsService'
import HardwareCard from '../components/hardware/HardwareCard'
import HardwareDetail from '../components/hardware/HardwareDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import hardwareService from '../services/hardwareService'
import {
  matchesSearch,
  matchesCategory,
  matchesBrand,
  matchesStockStatus,
  sortItems,
  extractCategories,
  formatPrice,
} from '../utils/helpers'

/**
 * CatalogPage — Halaman Utama #1: Pengelolaan Katalog & Pemantauan Stok Komponen Komputer.
 * Dilengkapi highlight Rekomendasi Minggu Ini, Produk Terlaris, Produk Pilihan,
 * serta Shop by Brand yang langsung memfilter katalog utama.
 */
export default function CatalogPage({
  onNavigate,
  initialCategory = 'All',
  isAdmin = false,
}) {
  const { items: rawItems, loading, source, refetch } = useHardware()
  const catalogSectionRef = useRef(null)

  // Filter & Sort states
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'All')
  const [activeBrand, setActiveBrand] = useState('All')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const categories = useMemo(() => extractCategories(rawItems), [rawItems])

  // Daftar brand unik untuk section Shop by Brand
  const brands = useMemo(() => {
    const map = new Map()
    rawItems.forEach((item) => {
      const b = (item.brand || '').trim()
      if (!b) return
      map.set(b, (map.get(b) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  }, [rawItems])

  // 3 Highlight Sections (Rekomendasi Minggu Ini, Produk Terlaris, Produk Pilihan)
  const weeklyPicks = useMemo(() => {
    const tagged = rawItems.filter((i) => i.is_weekly_pick)
    return (tagged.length > 0 ? tagged : rawItems).slice(0, 4)
  }, [rawItems])

  const bestsellers = useMemo(() => {
    const tagged = rawItems.filter((i) => i.is_bestseller)
    return (tagged.length > 0 ? tagged : rawItems).slice(0, 4)
  }, [rawItems])

  const featuredItems = useMemo(() => {
    const tagged = rawItems.filter((i) => i.is_featured)
    return (tagged.length > 0 ? tagged : rawItems).slice(0, 4)
  }, [rawItems])

  // Ringkasan KPI Gudang
  const stats = useMemo(() => {
    const totalSku = rawItems.length
    const totalUnits = rawItems.reduce((acc, i) => acc + Number(i.stock || 0), 0)
    const lowStockCount = rawItems.filter(
      (i) => Number(i.stock ?? 0) <= Number(i.min_stock ?? 5),
    ).length
    const totalValuation = rawItems.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.stock || 0),
      0,
    )
    return { totalSku, totalUnits, lowStockCount, totalValuation }
  }, [rawItems])

  const filteredItems = useMemo(() => {
    const result = rawItems.filter(
      (item) =>
        matchesSearch(item, search) &&
        matchesCategory(item, activeCategory) &&
        matchesBrand(item, activeBrand) &&
        matchesStockStatus(item, stockFilter),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawItems, search, activeCategory, activeBrand, stockFilter, sortKey, sortOrder])

  // Detail View state
  const [selectedItem, setSelectedItem] = useState(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Custom brand logos (disinkronkan dari Express API /api/settings)
  const [customBrandLogos, setCustomBrandLogos] = useState(
    () => readCachedSettings().brandLogos || {},
  )

  useEffect(() => {
    const loadLogos = () => {
      settingsService.getSettings().then((res) => {
        if (res?.success && res?.data?.brandLogos) {
          setCustomBrandLogos(res.data.brandLogos)
        }
      })
    }
    loadLogos()
    window.addEventListener('riglog-settings-updated', loadLogos)
    return () =>
      window.removeEventListener('riglog-settings-updated', loadLogos)
  }, [])

  const handleSelectBrand = (brandName) => {
    setActiveBrand((prev) => (prev === brandName ? 'All' : brandName))
    setActiveCategory('All')
    setStockFilter('all')
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await hardwareService.deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus komponen.')
    } finally {
      setDeleting(false)
    }
  }

  if (selectedItem) {
    return (
      <HardwareDetail
        item={selectedItem}
        isAdmin={isAdmin}
        onBack={() => {
          setSelectedItem(null)
          refetch()
        }}
        onEdit={isAdmin && onNavigate ? (hw) => onNavigate('Edit', hw) : undefined}
        onDelete={
          isAdmin
            ? (hw) => {
                setSelectedItem(null)
                setDeleteTarget(hw)
              }
            : undefined
        }
        onStockUpdated={() => refetch()}
      />
    )
  }

  return (
    <>
      <section className="masthead">
        <div className="masthead-top-row">
          <div>
            <span className="status-source-badge">
              Sumber Data:{' '}
              {source === 'api'
                ? 'RigLog Express API (Sinkron Live)'
                : 'Mode Offline Cache'}
            </span>
            <h1 className="display">Katalog &amp; Inventaris Komponen PC</h1>
            <p className="lede">
              Pemantauan stok real-time, lokasi penyimpanan rak gudang, dan datasheet spesifikasi teknis perangkat keras komputer.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={refetch}
            title="Sinkronkan ulang dengan server"
          >
            <RefreshCw size={15} /> Sinkronkan Data
          </button>
        </div>

        {/* Kartu Ringkasan KPI Inventaris */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--blue">
              <Cpu size={20} />
            </div>
            <div>
              <div className="kpi-val">{stats.totalSku} SKU</div>
              <div className="kpi-label">Katalog Terdaftar</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--emerald">
              <Boxes size={20} />
            </div>
            <div>
              <div className="kpi-val">{stats.totalUnits} Unit</div>
              <div className="kpi-label">Total Fisik Gudang</div>
            </div>
          </div>

          <div
            className="kpi-card kpi-card--clickable"
            onClick={() =>
              setStockFilter((prev) => (prev === 'low' ? 'all' : 'low'))
            }
            title="Klik untuk memfilter stok yang menipis"
          >
            <div className="kpi-icon kpi-icon--amber">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="kpi-val">{stats.lowStockCount} Item</div>
              <div className="kpi-label">Stok Menipis (Restock)</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--purple">
              <Wallet size={20} />
            </div>
            <div>
              <div className="kpi-val">{formatPrice(stats.totalValuation)}</div>
              <div className="kpi-label">Valuasi Aset Stok</div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          HIGHLIGHT 1: REKOMENDASI MINGGU INI
         ================================================================= */}
      {!loading && weeklyPicks.length > 0 && (
        <section className="highlight-section">
          <div className="list-head">
            <h2 className="highlight-heading">
              <Sparkles size={19} /> Rekomendasi Minggu Ini
            </h2>
            <span className="count">Pilihan rakitan minggu ini</span>
          </div>
          <ul className="highlight-row">
            {weeklyPicks.map((item) => (
              <HardwareCard
                key={`weekly-${item.id}`}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================
          HIGHLIGHT 2: PRODUK TERLARIS
         ================================================================= */}
      {!loading && bestsellers.length > 0 && (
        <section className="highlight-section">
          <div className="list-head">
            <h2 className="highlight-heading">
              <Flame size={19} /> Produk Terlaris
            </h2>
            <span className="count">Perputaran stok paling tinggi</span>
          </div>
          <ul className="highlight-row">
            {bestsellers.map((item) => (
              <HardwareCard
                key={`best-${item.id}`}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================
          HIGHLIGHT 3: PRODUK PILIHAN
         ================================================================= */}
      {!loading && featuredItems.length > 0 && (
        <section className="highlight-section">
          <div className="list-head">
            <h2 className="highlight-heading">
              <Award size={19} /> Produk Pilihan
            </h2>
            <span className="count">Komponen unggulan toko hardware</span>
          </div>
          <ul className="highlight-row">
            {featuredItems.map((item) => (
              <HardwareCard
                key={`feat-${item.id}`}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================
          KATALOG UTAMA (FILTERABLE BY CATEGORY, BRAND, STOCK, SEARCH)
         ================================================================= */}
      <section ref={catalogSectionRef} id="katalog-utama">
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>Daftar Stok Komponen</h2>
            {activeBrand !== 'All' && (
              <button
                type="button"
                className="active-brand-chip"
                onClick={() => setActiveBrand('All')}
                title="Hapus filter brand"
              >
                Brand: {activeBrand} <X size={13} />
              </button>
            )}
          </div>
          <div className="list-head-right">
            <span className="count">{filteredItems.length} komponen tampil</span>
            {isAdmin && onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Tambah Komponen
              </button>
            )}
          </div>
        </div>

        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          stockFilter={stockFilter}
          onStockFilter={setStockFilter}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat data inventaris komponen…</p>
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="state-box">
            <PackageOpen size={32} />
            <p>Tidak ada komponen yang cocok dengan filter pencarian.</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setSearch('')
                setActiveCategory('All')
                setActiveBrand('All')
                setStockFilter('all')
              }}
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {filteredItems.length > 0 && (
          <ul className="stock">
            {filteredItems.map((item) => (
              <HardwareCard
                key={item.id || item.sku}
                item={item}
                onSelect={setSelectedItem}
                onEdit={
                  isAdmin && onNavigate
                    ? (hw) => onNavigate('Edit', hw)
                    : undefined
                }
                onDelete={isAdmin ? setDeleteTarget : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      {/* =================================================================
          SHOP BY BRAND (Direct Filter ke Brand Terpilih ala AGRES.ID)
         ================================================================= */}
      {brands.length > 0 && (
        <section className="brand-showcase">
          <div className="list-head">
            <h2 className="highlight-heading">
              <Tag size={19} /> Shop by Brand
            </h2>
            {activeBrand !== 'All' && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setActiveBrand('All')}
              >
                Tampilkan Semua Brand
              </button>
            )}
          </div>
          <p className="lede" style={{ marginBottom: '14px' }}>
            Klik salah satu brand manufaktur di bawah ini untuk langsung memfilter katalog komponen khusus brand tersebut.
          </p>
          <div className="brand-grid">
            {brands.map((b) => {
              const isSelected = activeBrand === b.name
              const logoSrc = customBrandLogos[b.name] || BRAND_LOGOS[b.name]
              return (
                <button
                  key={b.name}
                  type="button"
                  className={`brand-tile${isSelected ? ' brand-tile--active' : ''}`}
                  onClick={() => handleSelectBrand(b.name)}
                >
                  {logoSrc && (
                    <div className="brand-tile__logo-wrap">
                      <img
                        src={logoSrc}
                        alt={`Logo ${b.name}`}
                        className="brand-tile__logo"
                      />
                    </div>
                  )}
                  <span className="brand-tile__name">{b.name}</span>
                  <span className="brand-tile__count">{b.count} Produk</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Komponen dari Gudang?"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}" (${deleteTarget?.sku})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
      />
      {deleteError && <div className="toast toast--error">{deleteError}</div>}
    </>
  )
}
