import { useState, useEffect, useMemo } from 'react'
import {
  Boxes,
  MapPin,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react'
import hardwareService from '../services/hardwareService'
import { useHardware } from '../hooks/useHardware'
import { HARDWARE_CATEGORIES, HARDWARE_SUPPLIERS } from '../data/hardwareData'
import { formatPrice } from '../utils/helpers'

/**
 * WarehousePage — Halaman 4: Pemantauan Zona Rak Gudang & Direktori Supplier Resmi.
 */
export default function WarehousePage({ isAdmin = false, onSelectCategory }) {
  const { items: products } = useHardware()
  const [categories, setCategories] = useState(HARDWARE_CATEGORIES)
  const [suppliers, setSuppliers] = useState(HARDWARE_SUPPLIERS)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    hardwareService.getCategories().then((res) => {
      if (Array.isArray(res) && res.length > 0) setCategories(res)
    })
    hardwareService.getSuppliers().then((res) => {
      if (Array.isArray(res) && res.length > 0) setSuppliers(res)
    })
  }, [])

  // Hitung statistik stok per kategori rak
  const enrichedCategories = useMemo(() => {
    return categories.map((cat) => {
      const matching = products.filter(
        (p) =>
          (p.category_name || p.type || '').toLowerCase() ===
          (cat.name || '').toLowerCase(),
      )
      const totalUnits = matching.reduce(
        (acc, p) => acc + Number(p.stock || 0),
        0,
      )
      const totalVal = matching.reduce(
        (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
        0,
      )
      return {
        ...cat,
        skuCount: matching.length,
        totalUnits,
        totalVal,
      }
    })
  }, [categories, products])

  const handleAddSupplier = async (e) => {
    e.preventDefault()
    if (!isAdmin || !supplierForm.name.trim()) return
    try {
      const created = await hardwareService.createSupplier({
        name: supplierForm.name.trim(),
        email: supplierForm.email.trim() || 'info@distributor.co.id',
        phone: supplierForm.phone.trim() || '021-6000000',
        address: supplierForm.address.trim() || 'Jakarta, Indonesia',
      })
      setSuppliers((prev) => [created, ...prev])
      setSupplierForm({ name: '', email: '', phone: '', address: '' })
      setShowAddSupplier(false)
      setFeedback(
        `Pemasok "${created.name}" berhasil disimpan ke database gudang!`,
      )
      setTimeout(() => setFeedback(''), 3500)
    } catch (err) {
      alert(err.message || 'Gagal menambahkan pemasok.')
    }
  }

  return (
    <div className="warehouse-page">
      <section className="masthead">
        <h1 className="display">Zona Rak Gudang &amp; Direktori Pemasok</h1>
        <p className="lede">
          Pemetaan kapasitas lorong penyimpanan berdasarkan kategori perangkat keras dan daftar distributor resmi mitra pengadaan barang.
        </p>
      </section>

      {feedback && (
        <div className="toast toast--success" style={{ marginTop: '20px' }}>
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* Bagian 1: Zona Rak & Kategori Komponen */}
      <section style={{ marginTop: '24px' }}>
        <div className="list-head">
          <h2>
            <Boxes size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Peta Kapasitas Rak &amp; Kategori Komponen
          </h2>
          <span className="count">{enrichedCategories.length} Zona Rak Aktif</span>
        </div>

        <div className="zone-grid">
          {enrichedCategories.map((zone) => (
            <div
              key={zone.id || zone.name}
              className="zone-card"
              onClick={() => onSelectCategory && onSelectCategory(zone.name)}
            >
              <div className="zone-card__top">
                <span className="rack-pill">
                  <MapPin size={13} /> {zone.aisle || 'Lorong Utama'}
                </span>
                <span className="mono-badge">{zone.skuCount} SKU</span>
              </div>

              <h3 className="zone-card__title display">{zone.name}</h3>
              <p className="zone-card__desc">
                {zone.description || 'Zona penyimpanan komponen komputer'}
              </p>

              <div className="zone-card__stats">
                <div>
                  <span className="delta-label">Total Fisik</span>
                  <strong>{zone.totalUnits} Unit</strong>
                </div>
                <div>
                  <span className="delta-label">Nilai Inventori</span>
                  <strong>{formatPrice(zone.totalVal)}</strong>
                </div>
              </div>

              <div className="zone-card__action">
                <span>Buka Katalog Zona Ini</span>
                <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bagian 2: Direktori Supplier / Distributor Resmi */}
      <section style={{ marginTop: '36px' }}>
        <div className="list-head">
          <h2>
            <Building2
              size={18}
              style={{ verticalAlign: 'middle', marginRight: '8px' }}
            />
            Direktori Distributor &amp; Pemasok Resmi
          </h2>
          {isAdmin && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowAddSupplier((prev) => !prev)}
            >
              {showAddSupplier ? <Minus size={15} /> : <Plus size={15} />}{' '}
              {showAddSupplier ? 'Tutup' : 'Tambah Pemasok'}
            </button>
          )}
        </div>

        {showAddSupplier && (
          <form
            onSubmit={handleAddSupplier}
            className="card-box entry-form"
            style={{ marginBottom: '20px' }}
          >
            <h3 className="card-box-title">Registrasi Mitra Distributor Baru</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nama Perusahaan Distributor *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: PT Erajaya Swasembada / EMD"
                  value={supplierForm.name}
                  onChange={(e) =>
                    setSupplierForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Pengadaan (B2B)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="supply@distributor.co.id"
                  value={supplierForm.email}
                  onChange={(e) =>
                    setSupplierForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nomor Telepon</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="021-612xxxx"
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Gudang / Kantor</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Mangga Dua, Jakarta Pusat"
                  value={supplierForm.address}
                  onChange={(e) =>
                    setSupplierForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-actions-bar">
              <button type="submit" className="btn btn--primary btn--sm">
                Simpan Distributor
              </button>
            </div>
          </form>
        )}

        <div className="supplier-grid">
          {suppliers.map((sup) => (
            <div key={sup.id || sup.name} className="supplier-card">
              <h3 className="supplier-card__name">{sup.name}</h3>
              {sup.specialty && (
                <p className="supplier-card__spec">{sup.specialty}</p>
              )}
              <div className="supplier-card__contacts">
                <span>
                  <Mail size={14} /> {sup.email || '-'}
                </span>
                <span>
                  <Phone size={14} /> {sup.phone || '-'}
                </span>
                <span>
                  <MapPin size={14} /> {sup.address || '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
