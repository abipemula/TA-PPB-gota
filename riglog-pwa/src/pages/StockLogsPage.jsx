import { useState, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Plus,
  Search,
  Loader,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { useStockLogs, useCreateStockLog } from '../hooks/useStockLogs'
import { useHardware } from '../hooks/useHardware'
import StockLogDetail from '../components/hardware/StockLogDetail'
import { getUserProfile } from '../services/userService'
import { formatDateTime } from '../utils/helpers'

/**
 * StockLogsPage — Halaman Utama #2: Pencatatan & Riwayat Mutasi Stok Gudang (IN / OUT / AUDIT).
 * Memiliki list transaksi mutasi stok di mana setiap item pada list dapat diklik
 * untuk menampilkan halaman detail (StockLogDetail).
 */
export default function StockLogsPage({ onInspectProduct }) {
  const { logs, loading, refetch } = useStockLogs()
  const { items: products, refetch: refetchProducts } = useHardware()
  const { recordMovement, loading: submitting } = useCreateStockLog()

  const [selectedLog, setSelectedLog] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState('')

  const profile = getUserProfile()
  const [formData, setFormData] = useState({
    product_id: '',
    type: 'IN',
    quantity: 5,
    reference_no: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_name: 'PT Nusantara Jaya Teknologi (NJT)',
    notes: '',
  })

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== 'ALL' && log.type !== typeFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (log.product_name || '').toLowerCase().includes(q)
        const matchSku = (log.sku || '').toLowerCase().includes(q)
        const matchRef = (log.reference_no || '').toLowerCase().includes(q)
        const matchOp = (log.operator || '').toLowerCase().includes(q)
        return matchName || matchSku || matchRef || matchOp
      }
      return true
    })
  }, [logs, typeFilter, search])

  const summary = useMemo(() => {
    const totalIn = logs
      .filter((l) => l.type === 'IN')
      .reduce((acc, l) => acc + Number(l.quantity || 0), 0)
    const totalOut = logs
      .filter((l) => l.type === 'OUT')
      .reduce((acc, l) => acc + Number(l.quantity || 0), 0)
    return { totalIn, totalOut, totalLogs: logs.length }
  }, [logs])

  const handleCreateLog = async (e) => {
    e.preventDefault()
    const targetProductId = formData.product_id || products[0]?.id
    const targetProduct = products.find(
      (p) => String(p.id) === String(targetProductId),
    )
    if (!targetProduct) return

    const created = await recordMovement({
      product_id: targetProduct.id,
      product_name: targetProduct.name,
      sku: targetProduct.sku,
      type: formData.type,
      quantity: Number(formData.quantity || 1),
      previous_stock: targetProduct.stock,
      reference_no: formData.reference_no,
      operator: `${profile.username} (${profile.role})`,
      supplier_name: formData.supplier_name,
      notes: formData.notes,
    })

    if (created) {
      setShowForm(false)
      setFeedback('Pencatatan mutasi stok berhasil disimpan dan stok komponen diperbarui!')
      refetch()
      refetchProducts()
      setTimeout(() => setFeedback(''), 4000)
    }
  }

  // Jika salah satu item mutasi diklik, tampilkan halaman detail mutasi
  if (selectedLog) {
    return (
      <StockLogDetail
        log={selectedLog}
        onBack={() => setSelectedLog(null)}
        onInspectProduct={(prodId) => {
          const found = products.find((p) => String(p.id) === String(prodId))
          if (found && onInspectProduct) {
            onInspectProduct(found)
          }
        }}
      />
    )
  }

  return (
    <div className="logs-page">
      <section className="masthead">
        <div className="masthead-top-row">
          <div>
            <h1 className="display">Pencatatan &amp; Mutasi Stok Gudang</h1>
            <p className="lede">
              Buku besar pergerakan inventaris barang masuk (Purchase Order), barang keluar (Penjualan/Rakitan), dan audit stok opname. Klik baris mutasi untuk melihat bukti detail.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowForm((prev) => !prev)}
          >
            <Plus size={16} /> {showForm ? 'Tutup Form' : 'Catat Mutasi Baru'}
          </button>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--blue">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="kpi-val">{summary.totalLogs} Transaksi</div>
              <div className="kpi-label">Total Dokumen Mutasi</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--emerald">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <div className="kpi-val">+{summary.totalIn} Unit</div>
              <div className="kpi-label">Total Barang Masuk (IN)</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--amber">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <div className="kpi-val">-{summary.totalOut} Unit</div>
              <div className="kpi-label">Total Barang Keluar (OUT)</div>
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success" style={{ marginTop: '20px' }}>
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* Form Pencatatan Mutasi Stok Baru */}
      {showForm && (
        <section className="card-box" style={{ marginTop: '24px' }}>
          <h2 className="card-box-title">Form Pencatatan Mutasi Stok Gudang</h2>
          <p className="card-box-desc">
            Pilih komponen, jenis pergerakan stok, dan jumlah unit. Sistem otomatis memperbarui saldo stok pada katalog utama.
          </p>

          <form onSubmit={handleCreateLog} className="entry-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="log-prod" className="form-label">
                  Pilih Komponen Hardware <span className="req">*</span>
                </label>
                <select
                  id="log-prod"
                  className="form-select"
                  value={formData.product_id || products[0]?.id || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, product_id: e.target.value }))
                  }
                  required
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      [{prod.sku}] {prod.name} (Stok saat ini: {prod.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="log-type" className="form-label">
                  Jenis Mutasi Stok <span className="req">*</span>
                </label>
                <select
                  id="log-type"
                  className="form-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  <option value="IN">BARANG MASUK (IN) — Restock / PO Baru</option>
                  <option value="OUT">
                    BARANG KELUAR (OUT) — Penjualan / Rakitan PC
                  </option>
                  <option value="AUDIT">
                    AUDIT OPNAME (AUDIT) — Penyesuaian Stok Fisik
                  </option>
                </select>
              </div>
            </div>

            <div className="form-grid form-grid--3">
              <div className="form-group">
                <label htmlFor="log-qty" className="form-label">
                  Kuantitas Unit <span className="req">*</span>
                </label>
                <input
                  id="log-qty"
                  type="number"
                  min="1"
                  max="1000"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, quantity: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="log-ref" className="form-label">
                  No. Dokumen PO / Invoice <span className="req">*</span>
                </label>
                <input
                  id="log-ref"
                  type="text"
                  className="form-input"
                  value={formData.reference_no}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, reference_no: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="log-sup" className="form-label">
                  Pemasok / Tujuan Distribusi
                </label>
                <input
                  id="log-sup"
                  type="text"
                  className="form-input"
                  value={formData.supplier_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, supplier_name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="log-notes" className="form-label">
                Catatan Pemeriksaan / Keterangan Mutasi
              </label>
              <textarea
                id="log-notes"
                rows="2"
                className="form-textarea"
                placeholder="Contoh: Barang diterima dalam kondisi segel utuh sesuai surat jalan..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setShowForm(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan…' : 'Simpan Mutasi Stok'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter & Search Mutasi */}
      <div className="adv-filter" style={{ marginTop: '24px' }}>
        <div className="adv-filter__search">
          <Search size={16} className="adv-filter__icon" />
          <input
            type="search"
            placeholder="Cari berdasarkan nama komponen, SKU, nomor PO/Invoice, atau nama petugas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="adv-filter__input"
          />
        </div>
        <div className="adv-filter__pills">
          {[
            { id: 'ALL', label: 'Semua Mutasi' },
            { id: 'IN', label: 'Barang Masuk (IN)' },
            { id: 'OUT', label: 'Barang Keluar (OUT)' },
            { id: 'AUDIT', label: 'Audit Opname' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pill${typeFilter === tab.id ? ' pill--active' : ''}`}
              onClick={() => setTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Riwayat Mutasi Stok (Setiap item dapat diklik untuk membuka halaman detail) */}
      <section>
        <div className="list-head">
          <h2>Daftar Riwayat Mutasi Gudang</h2>
          <span className="count">{filteredLogs.length} catatan ditemukan</span>
        </div>

        {loading ? (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat buku besar mutasi gudang…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="state-box">
            <p>Tidak ada catatan mutasi yang sesuai dengan pencarian.</p>
          </div>
        ) : (
          <ul className="log-list">
            {filteredLogs.map((log) => {
              const isIn = log.type === 'IN'
              const isOut = log.type === 'OUT'
              return (
                <li key={log.id} className="log-card">
                  <button
                    type="button"
                    className="log-card__btn"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div
                      className={`log-card__icon ${
                        isIn
                          ? 'log-card__icon--in'
                          : isOut
                            ? 'log-card__icon--out'
                            : 'log-card__icon--audit'
                      }`}
                    >
                      {isIn && <ArrowDownLeft size={20} />}
                      {isOut && <ArrowUpRight size={20} />}
                      {!isIn && !isOut && <ClipboardCheck size={20} />}
                    </div>

                    <div className="log-card__content">
                      <div className="log-card__top">
                        <span className="mono-badge">{log.reference_no}</span>
                        <span className="log-card__date">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      <h3 className="log-card__title">{log.product_name}</h3>
                      <p className="log-card__meta">
                        SKU: <strong>{log.sku}</strong> · Petugas:{' '}
                        {log.operator} · {log.supplier_name}
                      </p>
                      {log.notes && (
                        <p className="log-card__notes">“{log.notes}”</p>
                      )}
                    </div>

                    <div className="log-card__right">
                      <span
                        className={`movement-badge ${
                          isIn
                            ? 'movement-badge--in'
                            : isOut
                              ? 'movement-badge--out'
                              : 'movement-badge--audit'
                        }`}
                      >
                        {isIn
                          ? `+${log.quantity} Masuk`
                          : isOut
                            ? `-${log.quantity} Keluar`
                            : `${log.quantity} Audit`}
                      </span>
                      <span className="log-card__stock-trace">
                        Stok: {log.previous_stock} →{' '}
                        <strong>{log.current_stock}</strong>
                      </span>
                      <span className="detail-link-hint">Lihat Bukti →</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
