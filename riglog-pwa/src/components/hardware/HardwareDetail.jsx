import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft,
  Star,
  Loader,
  MapPin,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  ShoppingCart,
  Building2,
  Wallet,
  Receipt,
  Minus,
  Plus,
  X,
  Share2,
  CloudOff,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews } from '../../hooks/useReviews'
import { useCreateStockLog } from '../../hooks/useStockLogs'
import hardwareService from '../../services/hardwareService'
import { getUserProfile } from '../../services/userService'
import { formatPrice, averageRating, formatDateTime } from '../../utils/helpers'

const BANK_METHODS = [
  { id: 'BCA', label: 'Bank BCA', account: 'VA 8801 0812 3456 7890 · a.n. RigLog Hardware' },
  { id: 'BRI', label: 'Bank BRI', account: 'BRIVA 1280 0812 3456 7890 · a.n. RigLog Hardware' },
  { id: 'Mandiri', label: 'Bank Mandiri', account: 'VA 8902 0812 3456 7890 · a.n. RigLog Hardware' },
  { id: 'BNI', label: 'Bank BNI', account: 'VA 8277 0812 3456 7890 · a.n. RigLog Hardware' },
]

const EWALLET_METHODS = [
  { id: 'GoPay', label: 'GoPay', account: 'GoPay Merchant · 0812-3456-7890 (RigLog ID)' },
  { id: 'OVO', label: 'OVO', account: 'OVO Cash · 0812-3456-7890 (RigLog ID)' },
  { id: 'DANA', label: 'DANA', account: 'DANA Bisnis · 0812-3456-7890 (RigLog ID)' },
  { id: 'ShopeePay', label: 'ShopeePay', account: 'ShopeePay · 0812-3456-7890 (RigLog ID)' },
  { id: 'QRIS', label: 'QRIS', account: 'QRIS Nasional · NMID ID1026000019283 (RigLog ID)' },
]

const ALL_PAYMENT_METHODS = [...BANK_METHODS, ...EWALLET_METHODS]

/**
 * HardwareDetail — Halaman Detail Komponen Komputer ketika item di list diklik.
 * - Mode Customer (!isAdmin): Menampilkan tombol Beli & Checkout pembayaran lokal (Bank/E-Wallet)
 *   dengan auto-checkout saat nominal harga diketik sesuai, tanpa SOP penyimpanan gudang.
 * - Mode Admin (isAdmin): Menampilkan panel mutasi stok cepat (IN/OUT), edit/hapus, dan SOP QC Gudang.
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

  // State Checkout Customer (Fake Transaction + Pembayaran Lokal)
  const [showCheckout, setShowCheckout] = useState(false)
  const [buyQty, setBuyQty] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GoPay')
  const [paidInput, setPaidInput] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const checkoutSectionRef = useRef(null)
  const autoCheckoutKeyRef = useRef('')

  const { recordMovement, loading: recordingStock } = useCreateStockLog()

  const imgSrc = item.image_url || item.image || '/hardware/cpu.svg'
  const productUrl = (item.product_url || '').trim()
  const marketplaceLabel = (() => {
    const lower = productUrl.toLowerCase()
    if (lower.includes('shopee')) return 'Shopee'
    if (lower.includes('tokopedia') || lower.includes('tokped')) return 'Tokopedia'
    if (lower.includes('blibli')) return 'Blibli'
    if (lower.includes('lazada')) return 'Lazada'
    return 'Link Eksternal Produk'
  })()
  const category = item.category_name || item.type || 'Komponen PC'
  const brand = item.brand || 'Official Brand'
  const price = Number(item.price ?? 0)
  const minStock = Number(item.min_stock ?? 5)
  const isLowStock = currentStock <= minStock

  const safeBuyQty = Math.max(1, Math.min(Math.max(1, currentStock), Number(buyQty || 1)))
  const totalPrice = price * safeBuyQty
  const typedAmount = Number(String(paidInput).replace(/\D/g, '') || 0)
  const selectedMethodObj =
    ALL_PAYMENT_METHODS.find((m) => m.id === paymentMethod) || EWALLET_METHODS[0]

  // Reviews / Catatan Audit QC
  const { reviews } = useReviews(item.id)
  const avgRating = item.average_rating || averageRating(reviews)
  const reviewCount = item.review_count ?? reviews.length

  const executeCheckout = useCallback(
    async (amountToPay) => {
      if (checkoutLoading || currentStock < safeBuyQty) return
      if (amountToPay < totalPrice) {
        setCheckoutError(
          `Nominal pembayaran masih kurang ${formatPrice(totalPrice - amountToPay)}.`,
        )
        return
      }

      try {
        setCheckoutLoading(true)
        setCheckoutError('')
        const res = await hardwareService.checkout({
          product_id: item.id,
          quantity: safeBuyQty,
          payment_method: paymentMethod,
          paid_amount: amountToPay,
          customer_name: customerName.trim() || 'Customer RigLog',
        })
        if (res?.success && res?.data) {
          const nextStock = Number(
            res.data.remaining_stock ?? Math.max(0, currentStock - safeBuyQty),
          )
          setCurrentStock(nextStock)
          setReceipt(res.data)
          setPaidInput('')
          setBuyQty(1)
          if (onStockUpdated) onStockUpdated(nextStock)
        }
      } catch (err) {
        setCheckoutError(err.message || 'Gagal memproses transaksi checkout.')
      } finally {
        setCheckoutLoading(false)
      }
    },
    [
      checkoutLoading,
      currentStock,
      safeBuyQty,
      totalPrice,
      item.id,
      paymentMethod,
      customerName,
      onStockUpdated,
    ],
  )

  // Auto-checkout saat customer mengetik nominal harga persis sama dengan total tagihan
  useEffect(() => {
    if (!showCheckout || receipt || checkoutLoading || currentStock < safeBuyQty) {
      return
    }
    if (totalPrice > 0 && typedAmount === totalPrice) {
      const triggerKey = `${item.id}-${safeBuyQty}-${paymentMethod}-${typedAmount}`
      if (autoCheckoutKeyRef.current === triggerKey) return
      const timer = setTimeout(() => {
        autoCheckoutKeyRef.current = triggerKey
        executeCheckout(typedAmount)
      }, 280)
      return () => clearTimeout(timer)
    } else {
      autoCheckoutKeyRef.current = ''
    }
  }, [
    showCheckout,
    receipt,
    checkoutLoading,
    currentStock,
    safeBuyQty,
    totalPrice,
    typedAmount,
    item.id,
    paymentMethod,
    executeCheckout,
  ])

  const handleOpenCheckout = () => {
    setReceipt(null)
    setCheckoutError('')
    setPaidInput('')
    setBuyQty(1)
    autoCheckoutKeyRef.current = ''
    setShowCheckout(true)
    setTimeout(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

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
      hardwareService.updateCachedStock(item.id, nextStock)
      setAdjustNotes('')
      setAdjustFeedback(
        `Mutasi ${movementType === 'IN' ? 'Stok Masuk (+' : 'Stok Keluar (-'}${qty} unit) berhasil dicatat ke Log Gudang!`,
      )
      if (onStockUpdated) onStockUpdated(nextStock)
      setTimeout(() => setAdjustFeedback(''), 4000)
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
            {isAdmin && (
              <span className="rack-pill">
                <MapPin size={13} /> {item.rack_location || 'Rak A-01'}
              </span>
            )}
            {item.pendingSync && (
              <span className="pending-sync-pill">
                <CloudOff size={12} /> Cache Offline (Menunggu Sync)
              </span>
            )}
          </div>

          <h1 className="display">{item.name}</h1>
          <p className="type">
            {category} · Manufaktur: <strong>{brand}</strong>
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          <div className="detail-stock-banner">
            <span
              className={`stock-pill ${
                currentStock <= 0 || isLowStock
                  ? 'stock-pill--low'
                  : 'stock-pill--safe'
              }`}
            >
              {currentStock <= 0 ? (
                <>
                  <AlertTriangle size={14} /> Stok Habis (0 unit)
                </>
              ) : isLowStock ? (
                <>
                  <AlertTriangle size={14} /> Stok Menipis: {currentStock} unit
                  {isAdmin ? ` (Batas Min: ${minStock})` : ''}
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />{' '}
                  {isAdmin
                    ? `Stok Gudang Aman: ${currentStock} unit (Batas Min: ${minStock})`
                    : `Stok Tersedia: ${currentStock} unit`}
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
            {!isAdmin && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={currentStock <= 0}
                onClick={handleOpenCheckout}
              >
                <ShoppingCart size={16} />
                {currentStock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
              </button>
            )}
            <FavoriteButton itemId={item.id || item.name} />
            {productUrl && (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fav-btn product-link-btn"
                title={`Buka produk di ${marketplaceLabel}`}
                aria-label={`Buka produk di ${marketplaceLabel}`}
              >
                <Share2 size={17} />
              </a>
            )}
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

      {/* Panel Beli & Checkout Pembayaran Lokal (Mode Customer) */}
      {!isAdmin && (showCheckout || receipt) && (
        <section ref={checkoutSectionRef} className="detail-section checkout-panel">
          <div className="checkout-header">
            <div>
              <h2 className="checkout-title">
                <ShoppingCart size={19} /> Checkout Pembelian Komponen
              </h2>
              <p className="card-box-desc" style={{ margin: '4px 0 0' }}>
                Pilih metode pembayaran lokal (Bank / E-Wallet), lalu ketik nominal sesuai total tagihan untuk langsung checkout otomatis.
              </p>
            </div>
            {!receipt && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setShowCheckout(false)}
                aria-label="Tutup panel checkout"
              >
                <X size={16} /> Tutup
              </button>
            )}
          </div>

          {receipt ? (
            <div className="checkout-receipt">
              <div className="checkout-receipt__head">
                <div className="checkout-receipt__badge">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3>Pembayaran Berhasil &amp; Checkout Selesai!</h3>
                  <p>
                    Transaksi simulasi telah diverifikasi dan stok otomatis diperbarui di server RigLog.
                  </p>
                </div>
              </div>

              <div className="checkout-receipt__rows">
                <div className="checkout-receipt__row">
                  <span>No. Invoice</span>
                  <strong className="mono-badge">{receipt.invoice_no}</strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Waktu Transaksi</span>
                  <strong>{formatDateTime(receipt.created_at)}</strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Nama Pembeli</span>
                  <strong>{receipt.customer_name}</strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Komponen</span>
                  <strong>
                    {receipt.product_name} × {receipt.quantity} unit
                  </strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Metode Pembayaran</span>
                  <strong>{receipt.payment_method}</strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Total Tagihan</span>
                  <strong>{formatPrice(receipt.total_price)}</strong>
                </div>
                <div className="checkout-receipt__row">
                  <span>Nominal Dibayar</span>
                  <strong className="checkout-receipt__paid">
                    {formatPrice(receipt.paid_amount)} (LUNAS)
                  </strong>
                </div>
                {Number(receipt.change || 0) > 0 && (
                  <div className="checkout-receipt__row">
                    <span>Kembalian</span>
                    <strong>{formatPrice(receipt.change)}</strong>
                  </div>
                )}
                <div className="checkout-receipt__row">
                  <span>Sisa Stok Toko</span>
                  <strong>{receipt.remaining_stock} unit</strong>
                </div>
              </div>

              <div className="checkout-receipt__actions">
                {currentStock > 0 && (
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={handleOpenCheckout}
                  >
                    <Receipt size={15} /> Beli Lagi
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onBack}
                >
                  Kembali ke Katalog
                </button>
              </div>
            </div>
          ) : (
            <div className="checkout-body">
              {checkoutError && (
                <div className="toast toast--error">
                  <AlertTriangle size={16} /> {checkoutError}
                </div>
              )}

              {/* Baris Jumlah & Nama Pembeli */}
              <div className="checkout-top-grid">
                <div className="form-group">
                  <label className="form-label">Jumlah Pembelian</label>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="qty-stepper__btn"
                      disabled={safeBuyQty <= 1 || checkoutLoading}
                      onClick={() => setBuyQty((q) => Math.max(1, Number(q) - 1))}
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, currentStock)}
                      value={safeBuyQty}
                      disabled={checkoutLoading}
                      onChange={(e) => {
                        const val = Number(e.target.value || 1)
                        setBuyQty(Math.max(1, Math.min(currentStock, val)))
                      }}
                      className="qty-stepper__input"
                    />
                    <button
                      type="button"
                      className="qty-stepper__btn"
                      disabled={safeBuyQty >= currentStock || checkoutLoading}
                      onClick={() =>
                        setBuyQty((q) => Math.min(currentStock, Number(q) + 1))
                      }
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-customer-name" className="form-label">
                    Nama Pembeli (Opsional)
                  </label>
                  <input
                    id="checkout-customer-name"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={customerName}
                    disabled={checkoutLoading}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Metode Pembayaran Lokal: Transfer Bank & E-Wallet */}
              <div className="checkout-methods-block">
                <div className="checkout-method-group">
                  <span className="checkout-method-label">
                    <Building2 size={14} /> Transfer Bank Lokal
                  </span>
                  <div className="checkout-method-chips">
                    {BANK_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={checkoutLoading}
                        className={`payment-chip${
                          paymentMethod === m.id ? ' payment-chip--active' : ''
                        }`}
                        onClick={() => setPaymentMethod(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="checkout-method-group">
                  <span className="checkout-method-label">
                    <Wallet size={14} /> E-Wallet &amp; QRIS
                  </span>
                  <div className="checkout-method-chips">
                    {EWALLET_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={checkoutLoading}
                        className={`payment-chip${
                          paymentMethod === m.id ? ' payment-chip--active' : ''
                        }`}
                        onClick={() => setPaymentMethod(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="checkout-account-box">
                  <span>Tujuan Pembayaran ({selectedMethodObj.label}):</span>
                  <strong>{selectedMethodObj.account}</strong>
                </div>
              </div>

              {/* Ringkasan Tagihan & Input Ketik Harga Auto-Checkout */}
              <div className="checkout-pay-box">
                <div className="checkout-total-row">
                  <span>
                    Total Tagihan ({safeBuyQty} × {formatPrice(price)})
                  </span>
                  <strong className="checkout-total-price">
                    {formatPrice(totalPrice)}
                  </strong>
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-paid-input" className="form-label">
                    Ketik Nominal Pembayaran (Rp) — Otomatis Checkout
                  </label>
                  <input
                    id="checkout-paid-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={`Ketik ${totalPrice.toLocaleString('id-ID')} atau ${totalPrice}`}
                    value={paidInput}
                    disabled={checkoutLoading}
                    onChange={(e) => {
                      setCheckoutError('')
                      setPaidInput(e.target.value)
                    }}
                    className="form-input checkout-pay-input"
                  />

                  <div className="checkout-pay-hint">
                    {checkoutLoading ? (
                      <span className="checkout-hint--ok">
                        <Loader size={14} className="spin" /> Nominal sesuai! Memproses checkout otomatis…
                      </span>
                    ) : typedAmount === 0 ? (
                      <span>
                        Ketik nominal persis <strong>{totalPrice.toLocaleString('id-ID')}</strong> (atau <code>{totalPrice}</code>) agar langsung ter-checkout otomatis.
                      </span>
                    ) : typedAmount < totalPrice ? (
                      <span className="checkout-hint--warn">
                        Nominal terbaca: {formatPrice(typedAmount)} · Kurang{' '}
                        <strong>{formatPrice(totalPrice - typedAmount)}</strong>
                      </span>
                    ) : typedAmount === totalPrice ? (
                      <span className="checkout-hint--ok">
                        <CheckCircle2 size={14} /> Nominal pas ({formatPrice(typedAmount)})! Menjalankan checkout otomatis…
                      </span>
                    ) : (
                      <span className="checkout-hint--ok">
                        Nominal terbaca: {formatPrice(typedAmount)} (Kembalian{' '}
                        {formatPrice(typedAmount - totalPrice)}). Klik tombol di bawah untuk checkout.
                      </span>
                    )}
                  </div>
                </div>

                <div className="checkout-submit-row">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={checkoutLoading || typedAmount < totalPrice}
                    onClick={() => executeCheckout(typedAmount)}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader size={15} className="spin" /> Memproses Transaksi…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Bayar &amp; Checkout ({paymentMethod})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Panel Pencatatan Mutasi Stok Cepat (Khusus Admin) */}
      {isAdmin && (
        <section className="detail-section">
          <h2>
            <Package
              size={18}
              style={{ verticalAlign: 'middle', marginRight: '8px' }}
            />
            Pencatatan Cepat Mutasi Stok Gudang (IN / OUT)
          </h2>
          <p className="card-box-desc">
            Catat penambahan barang masuk (Restock PO) atau pengeluaran barang
            keluar (Penjualan/Rakitan). Setiap perubahan otomatis tercatat di
            halaman <strong>Mutasi Stok</strong>.
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

      {/* SOP Penanganan & Penyimpanan Gudang (Hanya tampil di Mode Admin) */}
      {isAdmin && item.steps && item.steps.length > 0 && (
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
