import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ShoppingCart,
  Loader,
  AlertCircle,
  ArrowRight,
  Trash2,
  Minus,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wallet,
  Receipt,
  CheckSquare,
  Square,
  X,
} from 'lucide-react'
import { useFavorites, removeFavorites } from '../hooks/useFavorites'
import { useHardware } from '../hooks/useHardware'
import HARDWARE_ITEMS from '../data/hardwareData'
import hardwareService from '../services/hardwareService'
import { formatPrice, formatDateTime } from '../utils/helpers'

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
 * FavoritesPage (Keranjang Belanja) — Halaman 3:
 * Layout daftar barang vertikal (atas ke bawah) dengan checkbox pilih item,
 * pengaturan jumlah (qty), ringkasan list barang yang akan di-CO,
 * total harga otomatis, dan checkout batch (Bank/E-Wallet + auto-checkout).
 * Barang yang tidak dicentang tetap tersisa di keranjang setelah checkout.
 */
export default function FavoritesPage({ onSelectHardware, onNavigateCatalog }) {
  const {
    favorites,
    loading: favLoading,
    error: favError,
    refetch,
  } = useFavorites()
  const {
    items: apiItems,
    loading: apiLoading,
    refetch: refetchHardware,
  } = useHardware()

  // Map ID barang -> dipilih (boolean) & jumlah beli (number)
  const [selectedMap, setSelectedMap] = useState({})
  const [qtyMap, setQtyMap] = useState({})
  const initializedIdsRef = useRef(new Set())

  // State Checkout Keranjang (sama persis dengan sistem CO di Katalog)
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GoPay')
  const [paidInput, setPaidInput] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const checkoutPanelRef = useRef(null)
  const autoCheckoutKeyRef = useRef('')

  const allKnownHardware = useMemo(() => {
    const map = new Map()
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

  const cartItems = useMemo(() => {
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

  // Inisialisasi default centang & qty = 1 untuk item baru yang muncul di keranjang
  useEffect(() => {
    if (cartItems.length === 0) return
    setSelectedMap((prev) => {
      const next = { ...prev }
      let changed = false
      cartItems.forEach((item) => {
        const key = String(item.id)
        const hasStock = Number(item.stock ?? 0) > 0
        if (!initializedIdsRef.current.has(key)) {
          initializedIdsRef.current.add(key)
          next[key] = hasStock
          changed = true
        } else if (!hasStock && next[key]) {
          next[key] = false
          changed = true
        }
      })
      return changed ? next : prev
    })
    setQtyMap((prev) => {
      const next = { ...prev }
      let changed = false
      cartItems.forEach((item) => {
        const key = String(item.id)
        const stock = Math.max(1, Number(item.stock ?? 1))
        if (next[key] === undefined) {
          next[key] = 1
          changed = true
        } else if (next[key] > stock) {
          next[key] = stock
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [cartItems])

  const selectableItems = useMemo(
    () => cartItems.filter((item) => Number(item.stock ?? 0) > 0),
    [cartItems],
  )

  const selectedItems = useMemo(
    () =>
      cartItems.filter(
        (item) =>
          Boolean(selectedMap[String(item.id)]) && Number(item.stock ?? 0) > 0,
      ),
    [cartItems, selectedMap],
  )

  const allSelected =
    selectableItems.length > 0 &&
    selectedItems.length === selectableItems.length

  const totalSelectedUnits = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum +
          Math.max(
            1,
            Math.min(Number(item.stock ?? 1), Number(qtyMap[String(item.id)] || 1)),
          ),
        0,
      ),
    [selectedItems, qtyMap],
  )

  const totalSelectedPrice = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const qty = Math.max(
          1,
          Math.min(Number(item.stock ?? 1), Number(qtyMap[String(item.id)] || 1)),
        )
        return sum + Number(item.price || 0) * qty
      }, 0),
    [selectedItems, qtyMap],
  )

  const typedAmount = Number(String(paidInput).replace(/\D/g, '') || 0)
  const selectedMethodObj =
    ALL_PAYMENT_METHODS.find((m) => m.id === paymentMethod) || EWALLET_METHODS[0]

  const toggleSelectItem = (itemId) => {
    const key = String(itemId)
    setSelectedMap((prev) => ({ ...prev, [key]: !prev[key] }))
    setCheckoutError('')
    autoCheckoutKeyRef.current = ''
  }

  const toggleSelectAll = () => {
    const targetVal = !allSelected
    const next = {}
    cartItems.forEach((item) => {
      const key = String(item.id)
      next[key] = targetVal && Number(item.stock ?? 0) > 0
    })
    setSelectedMap(next)
    setCheckoutError('')
    autoCheckoutKeyRef.current = ''
  }

  const updateItemQty = (item, nextVal) => {
    const maxStock = Math.max(1, Number(item.stock ?? 1))
    const clamped = Math.max(1, Math.min(maxStock, Number(nextVal || 1)))
    setQtyMap((prev) => ({ ...prev, [String(item.id)]: clamped }))
    setCheckoutError('')
    autoCheckoutKeyRef.current = ''
  }

  const handleRemoveOne = (itemId) => {
    removeFavorites([itemId])
    setSelectedMap((prev) => {
      const copy = { ...prev }
      delete copy[String(itemId)]
      return copy
    })
    initializedIdsRef.current.delete(String(itemId))
  }

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) return
    const ids = selectedItems.map((i) => i.id)
    removeFavorites(ids)
    setSelectedMap((prev) => {
      const copy = { ...prev }
      ids.forEach((id) => {
        delete copy[String(id)]
        initializedIdsRef.current.delete(String(id))
      })
      return copy
    })
  }

  const executeCartCheckout = useCallback(
    async (amountToPay) => {
      if (checkoutLoading || selectedItems.length === 0) return
      if (amountToPay < totalSelectedPrice) {
        setCheckoutError(
          `Nominal pembayaran masih kurang ${formatPrice(totalSelectedPrice - amountToPay)}.`,
        )
        return
      }

      const payloadItems = selectedItems.map((item) => ({
        product_id: item.id,
        quantity: Math.max(
          1,
          Math.min(Number(item.stock ?? 1), Number(qtyMap[String(item.id)] || 1)),
        ),
      }))

      try {
        setCheckoutLoading(true)
        setCheckoutError('')
        const res = await hardwareService.checkout({
          items: payloadItems,
          payment_method: paymentMethod,
          paid_amount: amountToPay,
          customer_name: customerName.trim() || 'Customer RigLog',
        })

        if (res?.success && res?.data) {
          const checkedOutIds = selectedItems.map((i) => i.id)
          const remainingCount = Math.max(
            0,
            cartItems.length - checkedOutIds.length,
          )
          // Hapus HANYA barang yang di-checkout dari keranjang (yang tidak dicentang tetap tersisa!)
          removeFavorites(checkedOutIds)
          setSelectedMap((prev) => {
            const copy = { ...prev }
            checkedOutIds.forEach((id) => {
              delete copy[String(id)]
              initializedIdsRef.current.delete(String(id))
            })
            return copy
          })
          setReceipt({
            ...res.data,
            remaining_cart_count: remainingCount,
          })
          setPaidInput('')
          setShowCheckout(false)
          refetchHardware()
        }
      } catch (err) {
        setCheckoutError(err.message || 'Gagal memproses checkout keranjang.')
      } finally {
        setCheckoutLoading(false)
      }
    },
    [
      checkoutLoading,
      selectedItems,
      totalSelectedPrice,
      qtyMap,
      paymentMethod,
      customerName,
      cartItems.length,
      refetchHardware,
    ],
  )

  // Auto-checkout saat nominal ketikan persis sama dengan total seluruh barang terpilih
  useEffect(() => {
    if (
      !showCheckout ||
      receipt ||
      checkoutLoading ||
      selectedItems.length === 0
    ) {
      return
    }
    if (totalSelectedPrice > 0 && typedAmount === totalSelectedPrice) {
      const signature = selectedItems
        .map((i) => `${i.id}:${qtyMap[String(i.id)] || 1}`)
        .join('|')
      const triggerKey = `${signature}-${paymentMethod}-${typedAmount}`
      if (autoCheckoutKeyRef.current === triggerKey) return
      const timer = setTimeout(() => {
        autoCheckoutKeyRef.current = triggerKey
        executeCartCheckout(typedAmount)
      }, 280)
      return () => clearTimeout(timer)
    } else {
      autoCheckoutKeyRef.current = ''
    }
  }, [
    showCheckout,
    receipt,
    checkoutLoading,
    selectedItems,
    qtyMap,
    totalSelectedPrice,
    typedAmount,
    paymentMethod,
    executeCartCheckout,
  ])

  const handleOpenCheckout = () => {
    if (selectedItems.length === 0) return
    setReceipt(null)
    setCheckoutError('')
    setPaidInput('')
    autoCheckoutKeyRef.current = ''
    setShowCheckout(true)
    setTimeout(() => {
      checkoutPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 60)
  }

  const isLoading = (favLoading || apiLoading) && cartItems.length === 0

  return (
    <div className="fav-page">
      <section className="masthead">
        <h1 className="display">Keranjang Belanja</h1>
        <p className="lede">
          Centang barang yang ingin dibeli sekaligus, atur jumlah unit, dan checkout langsung dengan metode pembayaran lokal. Barang yang tidak dicentang akan tetap tersimpan di keranjang.
        </p>
      </section>

      {/* Struk Pembayaran Berhasil (muncul setelah checkout keranjang sukses) */}
      {receipt && (
        <section className="detail-section checkout-panel" style={{ marginBottom: '22px' }}>
          <div className="checkout-receipt">
            <div className="checkout-receipt__head">
              <div className="checkout-receipt__badge">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3>Checkout Keranjang Berhasil &amp; Lunas!</h3>
                <p>
                  {receipt.total_items || receipt.items?.length || 1} komponen ({receipt.total_quantity || receipt.quantity || 1} unit) telah dibayar.{' '}
                  {receipt.remaining_cart_count > 0
                    ? `Masih tersisa ${receipt.remaining_cart_count} barang lain di keranjang.`
                    : 'Semua barang di keranjang telah selesai di-checkout.'}
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
                <span>Metode Pembayaran</span>
                <strong>{receipt.payment_method}</strong>
              </div>

              {/* Daftar seluruh barang yang baru di-checkout */}
              {Array.isArray(receipt.items) && receipt.items.length > 0 && (
                <div className="cart-receipt-items">
                  <span className="cart-receipt-items__title">
                    Rincian Barang yang Dibeli:
                  </span>
                  <ul>
                    {receipt.items.map((it) => (
                      <li key={it.product_id}>
                        <span>
                          {it.product_name} × {it.quantity} unit
                        </span>
                        <strong>{formatPrice(it.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
            </div>

            <div className="checkout-receipt__actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setReceipt(null)}
              >
                <Receipt size={15} /> Tutup Struk
              </button>
              {onNavigateCatalog && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onNavigateCatalog}
                >
                  Belanja Lagi di Katalog
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="fav-content">
        <div className="list-head">
          <h2>Daftar Barang di Keranjang</h2>
          <span className="count">{cartItems.length} barang tersimpan</span>
        </div>

        {isLoading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat isi keranjang belanja…</p>
          </div>
        )}

        {!isLoading && favError && cartItems.length === 0 && (
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

        {!isLoading && cartItems.length === 0 && !favError && (
          <div className="state-box">
            <ShoppingCart size={36} stroke="var(--steel)" />
            <h3>Keranjang belanja masih kosong</h3>
            <p className="lede">
              Buka halaman Katalog dan klik ikon Keranjang pada komponen yang ingin Anda beli, lalu checkout semuanya sekaligus di halaman ini.
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

        {cartItems.length > 0 && (
          <>
            {/* Toolbar Pilih Semua & Hapus Terpilih */}
            <div className="cart-toolbar">
              <button
                type="button"
                className="cart-select-all-btn"
                onClick={toggleSelectAll}
              >
                {allSelected ? (
                  <CheckSquare size={19} color="var(--accent)" />
                ) : (
                  <Square size={19} color="var(--steel)" />
                )}
                <span>
                  Pilih Semua ({selectedItems.length} / {cartItems.length} barang dipilih)
                </span>
              </button>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={handleRemoveSelected}
                  style={{ color: 'var(--accent-hover)' }}
                >
                  <Trash2 size={14} /> Hapus Terpilih
                </button>
              )}
            </div>

            {/* Daftar Barang Keranjang — Layout Vertikal (Atas ke Bawah) */}
            <ul className="cart-list">
              {cartItems.map((item) => {
                const key = String(item.id)
                const stock = Number(item.stock ?? 0)
                const isOutOfStock = stock <= 0
                const isChecked = Boolean(selectedMap[key]) && !isOutOfStock
                const qty = Math.max(
                  1,
                  Math.min(Math.max(1, stock), Number(qtyMap[key] || 1)),
                )
                const subtotal = Number(item.price || 0) * qty
                const imgSrc = item.image_url || item.image || '/hardware/cpu.svg'

                return (
                  <li
                    key={key}
                    className={`cart-item-row${
                      isChecked ? ' cart-item-row--selected' : ''
                    }${isOutOfStock ? ' cart-item-row--disabled' : ''}`}
                  >
                    {/* Checkbox Pilih Barang */}
                    <button
                      type="button"
                      className="cart-check-btn"
                      disabled={isOutOfStock}
                      onClick={() => toggleSelectItem(item.id)}
                      aria-label={
                        isChecked
                          ? `Batalkan pilihan ${item.name}`
                          : `Pilih ${item.name} untuk checkout`
                      }
                    >
                      {isChecked ? (
                        <CheckSquare size={22} color="var(--accent)" />
                      ) : (
                        <Square size={22} color="var(--muted)" />
                      )}
                    </button>

                    {/* Thumbnail Komponen */}
                    <button
                      type="button"
                      className="cart-item-thumb-btn"
                      onClick={() => onSelectHardware && onSelectHardware(item)}
                      title="Lihat detail komponen"
                    >
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="cart-item-thumb"
                      />
                    </button>

                    {/* Detail Informasi Barang */}
                    <div className="cart-item-info">
                      <div className="cart-item-meta">
                        <span className="cart-item-cat">
                          {item.category_name || item.type} · {item.brand}
                        </span>
                        <span className="mono-badge">{item.sku}</span>
                      </div>

                      <button
                        type="button"
                        className="cart-item-title"
                        onClick={() => onSelectHardware && onSelectHardware(item)}
                      >
                        {item.name}
                      </button>

                      <div className="cart-item-price-line">
                        <span className="cart-item-unit-price">
                          {formatPrice(item.price)}
                        </span>
                        <span
                          className={`cart-item-stock ${
                            isOutOfStock
                              ? 'cart-item-stock--out'
                              : stock <= Number(item.min_stock ?? 5)
                                ? 'cart-item-stock--low'
                                : 'cart-item-stock--ok'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Stok Habis'
                            : `Stok tersedia: ${stock} unit`}
                        </span>
                      </div>
                    </div>

                    {/* Kontrol Qty, Subtotal & Hapus */}
                    <div className="cart-item-controls">
                      <div className="qty-stepper qty-stepper--sm">
                        <button
                          type="button"
                          className="qty-stepper__btn"
                          disabled={isOutOfStock || qty <= 1}
                          onClick={() => updateItemQty(item, qty - 1)}
                          aria-label="Kurangi jumlah"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, stock)}
                          value={qty}
                          disabled={isOutOfStock}
                          onChange={(e) => updateItemQty(item, e.target.value)}
                          className="qty-stepper__input"
                        />
                        <button
                          type="button"
                          className="qty-stepper__btn"
                          disabled={isOutOfStock || qty >= stock}
                          onClick={() => updateItemQty(item, qty + 1)}
                          aria-label="Tambah jumlah"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-item-subtotal-wrap">
                        <span className="cart-item-subtotal-label">Subtotal</span>
                        <strong className="cart-item-subtotal">
                          {formatPrice(subtotal)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="icon-btn cart-remove-btn"
                        onClick={() => handleRemoveOne(item.id)}
                        title="Hapus dari Keranjang"
                        aria-label={`Hapus ${item.name} dari keranjang`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Ringkasan List Barang yang Akan di-CO & Total Harga Otomatis */}
            <section className="detail-section cart-summary-card">
              <div className="cart-summary-head">
                <div>
                  <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                    Ringkasan Checkout Keranjang
                  </h2>
                  <p className="card-box-desc" style={{ margin: '4px 0 0' }}>
                    {selectedItems.length > 0
                      ? `${selectedItems.length} dari ${cartItems.length} barang dicentang untuk di-checkout (${totalSelectedUnits} unit total).`
                      : 'Centang minimal 1 barang di atas untuk menghitung total dan melakukan checkout.'}
                  </p>
                </div>
                <div className="cart-summary-total-box">
                  <span className="cart-summary-total-label">Total Harga Terpilih</span>
                  <strong className="checkout-total-price">
                    {formatPrice(totalSelectedPrice)}
                  </strong>
                </div>
              </div>

              {/* List eksplisit barang apa saja yang akan di-CO */}
              {selectedItems.length > 0 && (
                <div className="cart-co-preview-list">
                  <span className="cart-co-preview-title">
                    Daftar Barang yang Akan di-CO:
                  </span>
                  <ul>
                    {selectedItems.map((item) => {
                      const qty = Math.max(
                        1,
                        Math.min(
                          Number(item.stock ?? 1),
                          Number(qtyMap[String(item.id)] || 1),
                        ),
                      )
                      return (
                        <li key={item.id}>
                          <span>
                            <strong>{item.name}</strong> × {qty} unit
                          </span>
                          <strong>
                            {formatPrice(Number(item.price || 0) * qty)}
                          </strong>
                        </li>
                      )
                    })}
                  </ul>
                  {cartItems.length > selectedItems.length && (
                    <p className="cart-remaining-note">
                      * {cartItems.length - selectedItems.length} barang yang tidak dicentang akan tetap tersisa di Keranjang.
                    </p>
                  )}
                </div>
              )}

              <div className="cart-summary-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={selectedItems.length === 0}
                  onClick={handleOpenCheckout}
                >
                  <ShoppingCart size={16} />
                  {selectedItems.length > 0
                    ? `Checkout Sekarang (${selectedItems.length} Barang · ${formatPrice(totalSelectedPrice)})`
                    : 'Pilih Barang Terlebih Dahulu'}
                </button>
              </div>
            </section>

            {/* Panel Pembayaran Lokal & Auto-Checkout (Sama seperti di Katalog) */}
            {showCheckout && selectedItems.length > 0 && (
              <section
                ref={checkoutPanelRef}
                className="detail-section checkout-panel"
                style={{ marginTop: '18px' }}
              >
                <div className="checkout-header">
                  <div>
                    <h2 className="checkout-title">
                      <Wallet size={19} /> Pembayaran Checkout Keranjang (
                      {selectedItems.length} Barang)
                    </h2>
                    <p className="card-box-desc" style={{ margin: '4px 0 0' }}>
                      Pilih metode pembayaran lokal (Bank / E-Wallet), lalu ketik nominal sesuai total gabungan untuk otomatis checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShowCheckout(false)}
                    aria-label="Tutup panel pembayaran"
                  >
                    <X size={16} /> Tutup
                  </button>
                </div>

                <div className="checkout-body">
                  {checkoutError && (
                    <div className="toast toast--error">
                      <AlertTriangle size={16} /> {checkoutError}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="cart-customer-name" className="form-label">
                      Nama Pembeli (Opsional)
                    </label>
                    <input
                      id="cart-customer-name"
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={customerName}
                      disabled={checkoutLoading}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="form-input"
                    />
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

                  {/* Input Nominal Auto-Checkout */}
                  <div className="checkout-pay-box">
                    <div className="checkout-total-row">
                      <span>
                        Total Tagihan ({selectedItems.length} barang ·{' '}
                        {totalSelectedUnits} unit)
                      </span>
                      <strong className="checkout-total-price">
                        {formatPrice(totalSelectedPrice)}
                      </strong>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cart-paid-input" className="form-label">
                        Ketik Nominal Pembayaran (Rp) — Otomatis Checkout
                      </label>
                      <input
                        id="cart-paid-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={`Ketik ${totalSelectedPrice.toLocaleString('id-ID')} atau ${totalSelectedPrice}`}
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
                            <Loader size={14} className="spin" /> Nominal sesuai! Memproses checkout {selectedItems.length} barang…
                          </span>
                        ) : typedAmount === 0 ? (
                          <span>
                            Ketik nominal persis{' '}
                            <strong>
                              {totalSelectedPrice.toLocaleString('id-ID')}
                            </strong>{' '}
                            (atau <code>{totalSelectedPrice}</code>) untuk langsung checkout otomatis.
                          </span>
                        ) : typedAmount < totalSelectedPrice ? (
                          <span className="checkout-hint--warn">
                            Nominal terbaca: {formatPrice(typedAmount)} · Kurang{' '}
                            <strong>
                              {formatPrice(totalSelectedPrice - typedAmount)}
                            </strong>
                          </span>
                        ) : typedAmount === totalSelectedPrice ? (
                          <span className="checkout-hint--ok">
                            <CheckCircle2 size={14} /> Nominal pas (
                            {formatPrice(typedAmount)})! Menjalankan checkout otomatis…
                          </span>
                        ) : (
                          <span className="checkout-hint--ok">
                            Nominal terbaca: {formatPrice(typedAmount)} (Kembalian{' '}
                            {formatPrice(typedAmount - totalSelectedPrice)}). Klik tombol di bawah untuk checkout.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="checkout-submit-row">
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={
                          checkoutLoading || typedAmount < totalSelectedPrice
                        }
                        onClick={() => executeCartCheckout(typedAmount)}
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader size={15} className="spin" /> Memproses Transaksi…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Bayar &amp; Checkout ({selectedItems.length} Barang · {paymentMethod})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </div>
  )
}
