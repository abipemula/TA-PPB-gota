import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  MapPin,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { useCreateStockLog } from '../../hooks/useStockLogs'
import { getUserProfile } from '../../services/userService'
import { formatPrice, averageRating, formatDateTime } from '../../utils/helpers'

/**
 * HardwareDetail — Halaman Detail Komponen Komputer ketika item di list diklik.
 * Menampilkan spesifikasi teknis, status & lokasi rak gudang, form mutasi stok cepat (IN/OUT),
 * serta catatan audit QC komponen.
 */
export default function HardwareDetail({
  item,
  isAdmin = false,
  onBack,
  onEdit,
  onDelete,
  onStockUpdated,
}) {
  const [currentStock, setCurrentStock] = useState(Number(item.stock ?? 0))
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustFeedback, setAdjustFeedback] = useState('')

  const { recordMovement, loading: recordingStock } = useCreateStockLog()

  const imgSrc = item.image_url || item.image || '/hardware/cpu.svg'
  const category = item.category_name || item.type || 'Komponen PC'
  const brand = item.brand || 'Official Brand'
  const price = item.price ?? 0
  const minStock = Number(item.min_stock ?? 5)
  const isLowStock = currentStock <= minStock

  // Reviews / Catatan Audit QC
  const {
    reviews,
    loading: reviewsLoading,
    refetch: refetchReviews,
  } = useReviews(item.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const avgRating = item.average_rating || averageRating(reviews)
  const reviewCount = item.review_count ?? reviews.length

  const handleQuickStockAdjust = async (movementType) => {
    const qty = Math.max(1, Number(adjustQty || 1))
    const profile = getUserProfile()
    const res = await recordMovement({
      product_id: item.id,
      product_name: item.name,
      sku: item.sku,
      type: movementType,
      quantity: qty,
      previous_stock: currentStock,
      operator: `${profile.username} (${profile.role})`,
      supplier_name:
        movementType === 'IN'
          ? 'Restock Gudang Utama'
          : 'Pengeluaran Barang / Rakitan Toko',
      notes:
        adjustNotes.trim() ||
        `Penyesuaian stok cepat (${movementType}) dari halaman detail komponen`,
    })

    if (res) {
      const nextStock =
        movementType === 'IN'
          ? currentStock + qty
          : Math.max(0, currentStock - qty)
      setCurrentStock(nextStock)
      setAdjustNotes('')
      setAdjustFeedback(
        `Mutasi ${movementType === 'IN' ? 'Stok Masuk (+' : 'Stok Keluar (-'}${qty} unit) berhasil dicatat ke Log Gudang!`,
      )
      if (onStockUpdated) onStockUpdated(nextStock)
      setTimeout(() => setAdjustFeedback(''), 4000)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Skor kondisi harus antara 1 sampai 5.')
      return
    }

    const profile = getUserProfile()
    const result = await createReview(item.id, {
      user_identifier: `${profile.username} (${profile.role})`,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Catatan audit QC berhasil disimpan!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Gagal menyimpan catatan audit.')
    }
  }

  return (
    <div className="detail">
      {/* Tombol Kembali */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Daftar Katalog
      </button>

      {/* Hero Info Komponen */}
      <div className="detail-hero">
        <div className="detail-img-box">
          <img className="detail-img" src={imgSrc} alt={item.name} />
        </div>
        <div className="detail-info">
          <div className="detail-badges-row">
            <span className="mono-badge">{item.sku || 'SKU-HW'}</span>
            <span className="rack-pill">
              <MapPin size={13} /> {item.rack_location || 'Rak A-01'}
            </span>
          </div>

          <h1 className="display">{item.name}</h1>
          <p className="type">
            {category} · Manufaktur: <strong>{brand}</strong>
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          <div className="detail-stock-banner">
            <span
              className={`stock-pill ${
                isLowStock ? 'stock-pill--low' : 'stock-pill--safe'
              }`}
            >
              {isLowStock ? (
                <>
                  <AlertTriangle size={14} /> Stok Menipis: {currentStock} unit
                  (Batas Min: {minStock})
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Stok Gudang Aman: {currentStock}{' '}
                  unit (Batas Min: {minStock})
                </>
              )}
            </span>
          </div>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star
                size={16}
                fill="var(--accent-amber)"
                stroke="var(--accent-amber)"
              />
              Skor QC: {avgRating.toFixed(1)} / 5.0 ({reviewCount} catatan audit)
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton itemId={item.id || item.name} />
            {onEdit && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onEdit({ ...item, stock: currentStock })}
              >
                <Pencil size={15} /> Edit Spesifikasi
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(item)}
              >
                <Trash2 size={15} /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel Pencatatan Mutasi Stok Cepat (Khusus Admin) */}
      {isAdmin && (
      <section className="detail-section">
        <h2>
          <Package size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Pencatatan Cepat Mutasi Stok Gudang (IN / OUT)
        </h2>
        <p className="card-box-desc">
          Catat penambahan barang masuk (Restock PO) atau pengeluaran barang keluar (Penjualan/Rakitan). Setiap perubahan otomatis tercatat di halaman <strong>Mutasi Stok</strong>.
        </p>

        {adjustFeedback && (
          <div className="toast toast--success" style={{ marginTop: '10px' }}>
            <CheckCircle2 size={18} /> {adjustFeedback}
          </div>
        )}

        <div className="quick-stock-grid">
          <div className="form-group">
            <label htmlFor="quick-qty" className="form-label">
              Jumlah Unit
            </label>
            <input
              id="quick-qty"
              type="number"
              min="1"
              max="500"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="quick-notes" className="form-label">
              Keterangan / No. Referensi PO / Invoice
            </label>
            <input
              id="quick-notes"
              type="text"
              placeholder="Contoh: PO-2026-1120 atau Rakitan PC Gaming Pelanggan"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="quick-stock-btns">
            <button
              type="button"
              className="btn btn--in"
              disabled={recordingStock}
              onClick={() => handleQuickStockAdjust('IN')}
            >
              <ArrowDownLeft size={16} /> + Barang Masuk (IN)
            </button>
            <button
              type="button"
              className="btn btn--out"
              disabled={recordingStock || currentStock <= 0}
              onClick={() => handleQuickStockAdjust('OUT')}
            >
              <ArrowUpRight size={16} /> - Barang Keluar (OUT)
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Deskripsi Komponen */}
      <section className="detail-section">
        <h2>Deskripsi &amp; Peruntukan Komponen</h2>
        <p>{item.description || 'Tidak ada deskripsi tambahan.'}</p>
      </section>

      {/* Spesifikasi Teknis */}
      {item.ingredients && item.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Spesifikasi Teknis (Datasheet)</h2>
          <ul className="detail-specs">
            {item.ingredients.map((spec, i) => (
              <li key={spec.id || i}>
                <span className="spec-label">{spec.name}</span>
                <strong className="spec-val">{spec.quantity}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* SOP Penanganan & Penyimpanan Gudang */}
      {item.steps && item.steps.length > 0 && (
        <section className="detail-section">
          <h2>Prosedur Penyimpanan &amp; QC Gudang</h2>
          <ol className="detail-steps">
            {item.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
