import { Search, SlidersHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * AdvancedFilter — Search bar + Filter Kategori + Filter Status Stok + Sortir
 */
export default function AdvancedFilter({
  search,
  onSearch,
  categories,
  activeCategory,
  onCategory,
  stockFilter = 'all',
  onStockFilter,
  sortKey,
  sortOrder,
  onSort,
}) {
  return (
    <div className="adv-filter">
      {/* Search Bar */}
      <div className="adv-filter__search">
        <Search size={16} className="adv-filter__icon" />
        <input
          type="search"
          placeholder="Cari nama komponen, kode SKU, brand, atau lokasi rak…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="adv-filter__input"
          aria-label="Cari komponen komputer"
        />
      </div>

      {/* Category Pills (klik ulang / double click untuk uncheck ke Semua Kategori) */}
      <div className="adv-filter__pills">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`pill${activeCategory === cat ? ' pill--active' : ''}`}
            onClick={() =>
              onCategory(
                activeCategory === cat && cat !== 'All' ? 'All' : cat,
              )
            }
            onDoubleClick={() => onCategory('All')}
          >
            {cat === 'All' ? 'Semua Kategori' : cat}
          </button>
        ))}
      </div>

      {/* Bottom Row: Stock Status Filter & Sort */}
      <div className="adv-filter__bottom-row">
        {onStockFilter && (
          <div className="adv-filter__stock-tabs">
            <button
              type="button"
              className={`stock-chip${stockFilter === 'all' ? ' stock-chip--active' : ''}`}
              onClick={() => onStockFilter('all')}
            >
              Semua Stok
            </button>
            <button
              type="button"
              className={`stock-chip stock-chip--warn${stockFilter === 'low' ? ' stock-chip--active' : ''}`}
              onClick={() =>
                onStockFilter(stockFilter === 'low' ? 'all' : 'low')
              }
              onDoubleClick={() => onStockFilter('all')}
            >
              <AlertTriangle size={13} /> Stok Menipis
            </button>
            <button
              type="button"
              className={`stock-chip stock-chip--ok${stockFilter === 'safe' ? ' stock-chip--active' : ''}`}
              onClick={() =>
                onStockFilter(stockFilter === 'safe' ? 'all' : 'safe')
              }
              onDoubleClick={() => onStockFilter('all')}
            >
              <CheckCircle2 size={13} /> Stok Aman
            </button>
          </div>
        )}

        <div className="adv-filter__sort">
          <SlidersHorizontal size={14} />
          <select
            value={`${sortKey}_${sortOrder}`}
            onChange={(e) => {
              const [key, order] = e.target.value.split('_')
              onSort({ key, order })
            }}
            aria-label="Urutkan komponen"
            className="adv-filter__select"
          >
            <option value="name_asc">Nama A → Z</option>
            <option value="name_desc">Nama Z → A</option>
            <option value="price_asc">Harga Terendah → Tertinggi</option>
            <option value="price_desc">Harga Tertinggi → Terendah</option>
            <option value="stock_asc">Stok Paling Sedikit</option>
            <option value="stock_desc">Stok Paling Banyak</option>
          </select>
        </div>
      </div>
    </div>
  )
}
