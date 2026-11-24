import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import hardwareService from '../services/hardwareService'
import uploadService from '../services/uploadService'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import ConfirmModal from '../components/modals/ConfirmModal'

const PRESET_VECTORS = [
  { label: 'Processor (CPU)', url: '/hardware/cpu.svg' },
  { label: 'Graphics Card (GPU)', url: '/hardware/gpu.svg' },
  { label: 'Motherboard', url: '/hardware/motherboard.svg' },
  { label: 'Memory (RAM)', url: '/hardware/ram.svg' },
  { label: 'Storage (SSD/NVMe)', url: '/hardware/storage.svg' },
  { label: 'Power Supply (PSU)', url: '/hardware/psu.svg' },
]

/**
 * CreateHardwarePage — Halaman 6: Registrasi Komponen Hardware Baru ke Katalog & Gudang.
 * Mendukung upload gambar / preset SVG, spesifikasi dinamis, SOP penyimpanan, dan auto-save draft (Modul 5).
 */
export default function CreateHardwarePage({ onBack, onSuccess }) {
  const [currentStep, setCurrentStep] = useState('upload')

  const [formData, setFormData] = useState({
    sku: `HW-${Date.now().toString().slice(-5)}`,
    name: '',
    brand: 'ASUS ROG',
    type: 'Graphics Card (GPU)',
    price: 5500000,
    stock: 10,
    min_stock: 5,
    rack_location: 'Rak A-02-B',
    description: '',
    is_featured: false,
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')

  const [specs, setSpecs] = useState([
    { name: 'Interface / Socket', quantity: 'PCIe 4.0 x16 / AM5' },
    { name: 'Kapasitas / Memori', quantity: '16 GB GDDR6X' },
    { name: 'Garansi Resmi', quantity: '3 Tahun Distributor' },
  ])

  const [steps, setSteps] = useState([
    'Periksa keutuhan segel distributor resmi dan kemasan anti-statis (ESD).',
    'Pastikan nomor seri (S/N) fisik komponen cocok dengan invoice penerimaan gudang.',
  ])

  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft('create'))
  const [draftTimestamp, setDraftTimestamp] = useState(() =>
    getDraftTimestamp('create'),
  )

  const handleSaveDraft = useCallback(
    (notify = true) => {
      const draftData = {
        formData,
        specs,
        steps,
        uploadedImageUrl,
      }
      const saved = saveDraft(draftData, 'create')
      if (saved) {
        const ts = getDraftTimestamp('create')
        setDraftTimestamp(ts)
        if (notify) {
          setSuccessMsg(`Draft tersimpan (${formatDraftTime(ts)})`)
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      }
    },
    [formData, specs, steps, uploadedImageUrl],
  )

  useEffect(() => {
    if (currentStep !== 'form') return
    const interval = setInterval(() => {
      handleSaveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [handleSaveDraft, currentStep])

  const handleLoadDraft = () => {
    const draft = loadDraft('create')
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.steps) setSteps(draft.steps)
      if (draft.uploadedImageUrl) {
        setUploadedImageUrl(draft.uploadedImageUrl)
        setImagePreview(draft.uploadedImageUrl)
        setCurrentStep('form')
      }
      setShowDraftModal(false)
      setSuccessMsg('Draft berhasil dipulihkan.')
      setTimeout(() => setSuccessMsg(''), 4000)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft('create')
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSelectPreset = (preset) => {
    setImageFile(null)
    setImagePreview(preset.url)
    setUploadedImageUrl(preset.url)
    setFormData((prev) => ({ ...prev, type: preset.label }))
    setCurrentStep('form')
    setError('')
  }

  const handleUploadImage = async () => {
    if (!imageFile) {
      if (uploadedImageUrl) {
        setCurrentStep('form')
        return
      }
      setError('Pilih gambar atau gunakan preset ikon terlebih dahulu.')
      return
    }
    try {
      setUploading(true)
      setError('')
      const result = await uploadService.uploadImage(imageFile)
      if (result.success && result.data?.url) {
        setUploadedImageUrl(result.data.url)
        setCurrentStep('form')
      } else {
        throw new Error('Gagal mengunggah gambar.')
      }
    } catch {
      setUploadedImageUrl('/hardware/cpu.svg')
      setCurrentStep('form')
    } finally {
      setUploading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addSpec = () =>
    setSpecs((prev) => [...prev, { name: '', quantity: '' }])

  const removeSpec = (index) => {
    if (specs.length <= 1) return
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStepChange = (index, value) => {
    setSteps((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addStep = () => setSteps((prev) => [...prev, ''])

  const removeStep = (index) => {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Nama komponen minimal 3 karakter.')
      return
    }

    const cleanSpecs = specs
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        quantity: s.quantity.trim() || 'Standar',
      }))

    const cleanSteps = steps.filter((s) => s.trim()).map((s) => s.trim())

    const payload = {
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      brand: formData.brand.trim() || 'Official Brand',
      type: formData.type,
      category_name: formData.type,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock ?? 0),
      min_stock: Number(formData.min_stock ?? 5),
      rack_location: formData.rack_location.trim() || 'Rak A-01',
      description:
        formData.description.trim() ||
        `Komponen ${formData.type} produksi ${formData.brand}.`,
      image_url: uploadedImageUrl || '/hardware/cpu.svg',
      is_featured: Boolean(formData.is_featured),
      ingredients: cleanSpecs,
      specs: cleanSpecs,
      steps: cleanSteps,
    }

    try {
      setCreating(true)
      const response = await hardwareService.createProduct(payload)
      if (response.success || response.data) {
        deleteDraft('create')
        if (onSuccess) onSuccess(response.data)
        else if (onBack) onBack()
      } else {
        throw new Error('Gagal menyimpan komponen.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan komponen.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Katalog
        </button>
        <div className="form-head-actions">
          {currentStep === 'form' && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => handleSaveDraft(true)}
            >
              <Save size={14} /> Simpan Draft
            </button>
          )}
        </div>
      </div>

      <div className="form-title-group">
        <h1 className="display">Registrasi Komponen Baru</h1>
        <p className="lede">
          Tambahkan item perangkat keras baru ke dalam sistem inventaris gudang dan katalog toko RigLog.
        </p>
      </div>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <div className="form-steps-nav">
        <div
          className={`step-badge ${
            currentStep === 'upload' ? 'step-badge--active' : 'step-badge--done'
          }`}
        >
          1. Foto / Visual Komponen
        </div>
        <div className="step-badge-connector" />
        <div
          className={`step-badge ${
            currentStep === 'form' ? 'step-badge--active' : ''
          }`}
        >
          2. Spesifikasi, Stok &amp; Lokasi Rak
        </div>
      </div>

      {currentStep === 'upload' && (
        <div className="card-box">
          <h2 className="card-box-title">Visual Komponen Hardware</h2>
          <p className="card-box-desc">
            Unggah foto kemasan/fisik komponen (maks 5MB) atau pilih preset vektor kategori di bawah ini.
          </p>

          {!imagePreview ? (
            <div className="upload-dropzone">
              <input
                id="hw-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
              <label htmlFor="hw-image-input" className="upload-label">
                <Upload size={36} className="upload-icon" />
                <span className="upload-main-text">
                  Klik untuk memilih file foto komponen
                </span>
                <span className="upload-sub-text">
                  JPG, PNG, WebP, atau SVG hingga 5MB
                </span>
              </label>

              <div className="preset-selector">
                <span className="preset-title">
                  Atau pilih ilustrasi vektor kategori standar:
                </span>
                <div className="preset-pills">
                  {PRESET_VECTORS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="pill"
                      onClick={() => handleSelectPreset(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <div className="preview-image-wrap">
                <img
                  src={imagePreview}
                  alt="Preview komponen"
                  className="preview-img"
                />
                <button
                  type="button"
                  className="preview-remove-btn"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setUploadedImageUrl('')
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="preview-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleUploadImage}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader size={18} className="spin" /> Mengunggah…
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Gunakan Gambar &amp; Lanjutkan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'form' && (
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="selected-thumb-bar">
            <img
              src={uploadedImageUrl || imagePreview}
              alt="Selected"
              className="thumb-small"
            />
            <div className="thumb-info">
              <span className="thumb-title">Visual Komponen Siap</span>
              <span className="thumb-sub">Lengkapi data inventaris di bawah</span>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setCurrentStep('upload')}
            >
              Ganti Gambar
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nama Lengkap Komponen <span className="req">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Contoh: Intel Core Ultra 9 285K / RTX 4080 SUPER"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sku" className="form-label">
                Kode SKU Gudang <span className="req">*</span>
              </label>
              <input
                id="sku"
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-grid form-grid--3">
            <div className="form-group">
              <label htmlFor="type" className="form-label">
                Kategori Hardware <span className="req">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="Processor (CPU)">Processor (CPU)</option>
                <option value="Graphics Card (GPU)">Graphics Card (GPU)</option>
                <option value="Motherboard">Motherboard</option>
                <option value="Memory (RAM)">Memory (RAM)</option>
                <option value="Storage (SSD/NVMe)">Storage (SSD/NVMe)</option>
                <option value="Power Supply (PSU)">Power Supply (PSU)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="brand" className="form-label">
                Brand / Manufaktur <span className="req">*</span>
              </label>
              <input
                id="brand"
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
                placeholder="Contoh: AMD, ASUS ROG, MSI, Corsair"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Harga Satuan (Rp) <span className="req">*</span>
              </label>
              <div className="price-stepper-wrap">
                <input
                  id="price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  min="0"
                  step="1"
                  className="form-input price-stepper-input"
                  required
                />
                <div className="price-stepper-btns">
                  <button
                    type="button"
                    className="price-step-btn"
                    title="Tambah Rp 50.000"
                    aria-label="Tambah Rp 50.000"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        price: (Number(p.price) || 0) + 50000,
                      }))
                    }
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="price-step-btn"
                    title="Kurangi Rp 50.000"
                    aria-label="Kurangi Rp 50.000"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        price: Math.max(0, (Number(p.price) || 0) - 50000),
                      }))
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-grid form-grid--3">
            <div className="form-group">
              <label htmlFor="stock" className="form-label">
                Stok Awal Gudang (Unit) <span className="req">*</span>
              </label>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFormChange}
                min="0"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_stock" className="form-label">
                Batas Minimum Stok (Alert) <span className="req">*</span>
              </label>
              <input
                id="min_stock"
                type="number"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleFormChange}
                min="1"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rack_location" className="form-label">
                Lokasi Rak Penyimpanan <span className="req">*</span>
              </label>
              <input
                id="rack_location"
                type="text"
                name="rack_location"
                value={formData.rack_location}
                onChange={handleFormChange}
                placeholder="Contoh: Rak A-01-B"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Deskripsi &amp; Catatan Katalog
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Jelaskan fitur utama, arsitektur, dan kompatibilitas komponen..."
              className="form-textarea"
            />
          </div>

          {/* Spesifikasi Teknis */}
          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">Spesifikasi Teknis (Datasheet)</label>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={addSpec}
              >
                <Plus size={14} /> Tambah Baris Spesifikasi
              </button>
            </div>
            <div className="multi-rows">
              {specs.map((spec, i) => (
                <div key={i} className="multi-row">
                  <input
                    type="text"
                    placeholder="Parameter (cth: Socket, VRAM, TDP)"
                    value={spec.name}
                    onChange={(e) =>
                      handleSpecChange(i, 'name', e.target.value)
                    }
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Nilai (cth: AM5, 16GB GDDR6X, 120W)"
                    value={spec.quantity}
                    onChange={(e) =>
                      handleSpecChange(i, 'quantity', e.target.value)
                    }
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn--danger-ghost"
                    onClick={() => removeSpec(i)}
                    disabled={specs.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Prosedur Penanganan Gudang */}
          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">
                SOP Pemeriksaan &amp; Penyimpanan Gudang
              </label>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={addStep}
              >
                <Plus size={14} /> Tambah SOP
              </button>
            </div>
            <div className="multi-rows">
              {steps.map((st, i) => (
                <div key={i} className="step-row">
                  <span className="step-num">{i + 1}</span>
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => handleStepChange(i, e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn--danger-ghost"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onBack}
              disabled={creating}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader size={18} className="spin" /> Menyimpan ke Gudang…
                </>
              ) : (
                'Simpan Komponen ke Katalog'
              )}
            </button>
          </div>
        </form>
      )}

      <ConfirmModal
        open={showDraftModal}
        title="Pulihkan Draft Sebelumnya?"
        message={`Ditemukan draft pendaftaran komponen yang belum selesai (${
          draftTimestamp ? formatDraftTime(draftTimestamp) : 'sebelumnya'
        }). Apakah Anda ingin melanjutkan pengisian?`}
        confirmLabel="Pulihkan Draft"
        cancelLabel="Hapus Draft"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
