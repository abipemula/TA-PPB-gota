import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Calendar,
  User,
  Building2,
  FileText,
  Cpu,
} from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'

/**
 * StockLogDetail — Halaman Detail untuk item pada list Riwayat Mutasi Stok (Halaman Utama #2).
 * Memenuhi syarat Tugas Akhir: minimal 2 halaman utama memiliki list yang setiap itemnya
 * dapat diklik untuk menampilkan halaman detail.
 */
export default function StockLogDetail({ log, onBack, onInspectProduct }) {
  if (!log) return null

  const isIn = log.type === 'IN'
  const isOut = log.type === 'OUT'

  return (
    <div className="detail">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Riwayat Mutasi Stok
      </button>

      <section className="detail-section">
        <div className="log-detail-header">
          <div>
            <span className="mono-badge">
              ID Referensi: {log.reference_no || log.id}
            </span>
            <h1 className="display" style={{ marginTop: '10px', marginBottom: '6px' }}>
              Bukti Pencatatan Mutasi Gudang
            </h1>
            <p className="type">
              Dicatat pada {formatDateTime(log.created_at)}
            </p>
          </div>

          <span
            className={`movement-badge ${
              isIn
                ? 'movement-badge--in'
                : isOut
                  ? 'movement-badge--out'
                  : 'movement-badge--audit'
            }`}
          >
            {isIn && <ArrowDownLeft size={16} />}
            {isOut && <ArrowUpRight size={16} />}
            {!isIn && !isOut && <ClipboardCheck size={16} />}
            {isIn
              ? `BARANG MASUK (+${log.quantity} Unit)`
              : isOut
                ? `BARANG KELUAR (-${log.quantity} Unit)`
                : `AUDIT OPNAME (${log.quantity} Unit)`}
          </span>
        </div>

        {/* Ringkasan Perubahan Angka Stok */}
        <div className="stock-delta-grid">
          <div className="delta-card">
            <span className="delta-label">Stok Sebelumnya</span>
            <strong className="delta-val">{log.previous_stock ?? 0} Unit</strong>
          </div>
          <div className="delta-card delta-card--highlight">
            <span className="delta-label">Mutasi ({log.type})</span>
            <strong className="delta-val">
              {isIn ? `+${log.quantity}` : isOut ? `-${log.quantity}` : log.quantity}{' '}
              Unit
            </strong>
          </div>
          <div className="delta-card">
            <span className="delta-label">Stok Akhir Tercatat</span>
            <strong className="delta-val">{log.current_stock ?? 0} Unit</strong>
          </div>
        </div>
      </section>

      {/* Detail Informasi Transaksi Gudang */}
      <section className="detail-section">
        <h2>Rincian Dokumen &amp; Otorisasi Gudang</h2>
        <ul className="detail-specs">
          <li>
            <span className="spec-label">
              <Cpu size={14} /> Nama Komponen
            </span>
            <strong className="spec-val">{log.product_name}</strong>
          </li>
          <li>
            <span className="spec-label">Kode SKU</span>
            <strong className="spec-val">{log.sku || 'SKU-HW'}</strong>
          </li>
          <li>
            <span className="spec-label">
              <FileText size={14} /> Nomor Dokumen / PO / Invoice
            </span>
            <strong className="spec-val">{log.reference_no || '-'}</strong>
          </li>
          <li>
            <span className="spec-label">
              <User size={14} /> Petugas Pencatat (PIC)
            </span>
            <strong className="spec-val">{log.operator || 'Admin Gudang'}</strong>
          </li>
          <li>
            <span className="spec-label">
              <Building2 size={14} /> Sumber / Tujuan Distribusi
            </span>
            <strong className="spec-val">
              {log.supplier_name || 'Gudang Internal'}
            </strong>
          </li>
          <li>
            <span className="spec-label">
              <Calendar size={14} /> Waktu Pencatatan Sistem
            </span>
            <strong className="spec-val">{formatDateTime(log.created_at)}</strong>
          </li>
        </ul>

        <div style={{ marginTop: '20px' }}>
          <h3 className="section-title" style={{ marginBottom: '8px' }}>
            Catatan &amp; Keterangan Tambahan
          </h3>
          <p className="log-notes-box">
            {log.notes || 'Tidak ada catatan tambahan pada mutasi ini.'}
          </p>
        </div>

        {onInspectProduct && log.product_id && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onInspectProduct(log.product_id)}
            >
              <Cpu size={16} /> Buka Halaman Detail Komponen Terkait
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
