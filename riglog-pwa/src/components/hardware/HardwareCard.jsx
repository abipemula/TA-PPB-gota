import { MapPin, AlertTriangle, CheckCircle2, Pencil, Trash2, CloudOff } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'

/**
 * HardwareCard — Kartu komponen komputer pada list Katalog & Watchlist.
 * Klik kartu untuk membuka halaman detail komponen (HardwareDetail).
 */
export default function HardwareCard({ item, onSelect, onEdit, onDelete }) {
  const imgSrc = item.image_url || item.image || '/hardware/cpu.svg'
  const category = item.category_name || item.type || 'Komponen PC'
  const brand = item.brand || 'Official'
  const price = item.price ?? 0
  const stock = Number(item.stock ?? 0)
  const minStock = Number(item.min_stock ?? 5)
  const isLowStock = stock <= minStock

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(item)}
        aria-label={`Lihat detail ${item.name}`}
      >
        <div className="card-img-wrap">
          <img
            className="card-img"
            src={imgSrc}
            alt={item.name}
            width="240"
            height="160"
            loading="lazy"
          />
          <span className="sku-badge">{item.sku || 'SKU-HW'}</span>
          {item.pendingSync && (
            <span className="pending-sync-badge" title="Tersimpan di cache disk, otomatis sinkron saat online">
              <CloudOff size={11} /> Offline · Belum Sync
            </span>
          )}
        </div>

        <div className="card-body">
          <div className="card-meta-row">
            <span className="type">
              {category} · <strong>{brand}</strong>
            </span>
          </div>

          <span className="name display">{item.name}</span>

          {item.description && (
            <span className="card-desc">{truncate(item.description, 75)}</span>
          )}

          <div className="card-stock-row">
            <span
              className={`stock-pill ${
                isLowStock ? 'stock-pill--low' : 'stock-pill--safe'
              }`}
            >
              {isLowStock ? (
                <>
                  <AlertTriangle size={12} /> Sisa {stock} unit (Min: {minStock})
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} /> Tersedia {stock} unit
                </>
              )}
            </span>

            <span className="rack-pill">
              <MapPin size={12} /> {item.rack_location || 'Rak A-01'}
            </span>
          </div>

          <div className="card-footer-row">
            <span className="price">{formatPrice(price)}</span>
            <span className="detail-link-hint">Detail →</span>
          </div>
        </div>
      </button>

      {/* Tombol aksi cepat di pojok kanan atas kartu */}
      <div className="card-actions">
        <FavoriteButton itemId={item.id || item.name} />
        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            aria-label={`Edit ${item.name}`}
            title="Edit Komponen"
          >
            <Pencil size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            aria-label={`Hapus ${item.name}`}
            title="Hapus Komponen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}
