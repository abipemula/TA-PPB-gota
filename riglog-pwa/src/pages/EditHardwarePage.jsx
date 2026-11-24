import { useState, useEffect } from 'react'
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

/**
 * EditHardwarePage — Halaman 7: Ubah Data, Spesifikasi, atau Stok Komponen Hardware.
 */
export default function EditHardwarePage({
  item,
  itemId,
  onBack,
  onSuccess,
}) {
  const targetId = itemId || item?.id
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    type: 'Processor (CPU)',
    price: 0,
    stock: 0,
    min_stock: 5,
    rack_location: 'Rak A-01',
    description: '',
    is_featured: false,
  })

  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [specs, setSpecs] = useState([{ name: '', quantity: '' }])
  const [steps, setSteps] = useState([''])

  const [showDraftModal, setShowDraftModal] = useState(() =>
    targetId ? hasDraft(targetId) : false,
  )
  const [draftTimestamp, setDraftTimestamp] = useState(() =>
    targetId ? getDraftTimestamp(targetId) : null,
  )

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        let data = item
        if (!data || !data.ingredients) {
          const res = await hardwareService.getProductById(targetId)
          if (res.success && res.data) data = res.data
        }
        if (data) {
          setFormData({
            sku: data.sku || '',
            name: data.name || '',
            brand: data.brand || 'Official',
            type: data.category_name || data.type || 'Processor (CPU)',
            price: data.price ?? 0,
            stock: data.stock ?? 0,
            min_stock: data.min_stock ?? 5,
            rack_location: data.rack_location || 'Rak A-01',
            description: data.description || '',
            is_featured: Boolean(data.is_featured),
          })
          setCurrentImageUrl(
            data.image_url || data.image || '/hardware/cpu.svg',
          )
          if (data.ingredients && data.ingredients.length > 0) {
            setSpecs(
              data.ingredients.map((ing) => ({
                name: ing.name || '',
                quantity: ing.quantity || '',
              })),
            )
          }
          if (data.steps && data.steps.length > 0) {
            setSteps(
              data.steps.map((st) =>
                typeof st === 'string' ? st : st.instruction || '',
              ),
            )
          }
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat data komponen.')
      } finally {
        setLoading(false)
      }
    }
    if (targetId) fetchItem()
  }, [targetId, item])

  const handleLoadDraft = () => {
    const draft = loadDraft(targetId)
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.steps) setSteps(draft.steps)
      if (draft.imagePreview) setImagePreview(draft.imagePreview)
      setShowDraftModal(false)
      setSuccessMsg('Draft perubahan dipulihkan.')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft(targetId)
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  const handleManualSaveDraft = () => {
    const saved = saveDraft(
      {
        formData,
        specs,
        steps,
        imagePreview: imagePreview || currentImageUrl,
      },
      targetId,
    )
    if (saved) {
      const ts = getDraftTimestamp(targetId)
      setDraftTimestamp(ts)
      setSuccessMsg(`Draft disimpan (${formatDraftTime(ts)})`)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleUploadNewImage = async () => {
    if (!imageFile) return
    try {
      setUploading(true)
      const res = await uploadService.uploadImage(imageFile)
      if (res.success && res.data?.url) {
        setCurrentImageUrl(res.data.url)
        setImageFile(null)
        setImagePreview(null)
        setSuccessMsg('Gambar baru berhasil diterapkan.')
      }
    } catch {
      setCurrentImageUrl(imagePreview)
      setImageFile(null)
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
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

    const cleanSpecs = specs
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        quantity: s.quantity.trim() || 'Standar',
      }))

    const cleanSteps = steps.filter((s) => s.trim()).map((s) => s.trim())

    try {
      setUpdating(true)

      // Jika user memilih gambar baru tapi belum klik "Terapkan Gambar",
      // otomatis upload ke disk/base64 agar tidak menyimpan blob: URL sementara.
      let finalImageUrl = currentImageUrl || '/hardware/cpu.svg'
      if (imageFile) {
        const uploaded = await uploadService.uploadImage(imageFile)
        if (uploaded.success && uploaded.data?.url) {
          finalImageUrl = uploaded.data.url
          setCurrentImageUrl(finalImageUrl)
          setImageFile(null)
          setImagePreview(null)
        }
      } else if (imagePreview && !imagePreview.startsWith('blob:')) {
        finalImageUrl = imagePreview
      }

      const payload = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        type: formData.type,
        category_name: formData.type,
        price: Number(formData.price) || 0,
        stock: Number(formData.stock ?? 0),
        min_stock: Number(formData.min_stock ?? 5),
        rack_location: formData.rack_location.trim(),
        description: formData.description.trim(),
        image_url: finalImageUrl,
        is_featured: Boolean(formData.is_featured),
        ingredients: cleanSpecs,
        specs: cleanSpecs,
        steps: cleanSteps,
      }

      const res = await hardwareService.updateProduct(targetId, payload)
      if (res.success || res.data) {
        deleteDraft(targetId)
        if (onSuccess) onSuccess(res.data)
        else if (onBack) onBack()
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui komponen.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="state-box">
        <Loader size={32} className="spin" />
        <p>Memuat data komponen untuk diedit…</p>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleManualSaveDraft}
        >
          <Save size={14} /> Simpan Draft
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Perbarui Data Komponen</h1>
        <p className="lede">
          ID Komponen: <code className="mono-badge">{targetId}</code>
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

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="card-box">
          <h2 className="card-box-title">Visual Komponen</h2>
          <div className="edit-img-wrap">
            <img
              src={imagePreview || currentImageUrl}
              alt="Current hardware"
              className="edit-current-img"
            />
            <div className="edit-img-controls">
              <input
                id="edit-hw-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
              <label
                htmlFor="edit-hw-image"
                className="btn btn--outline btn--sm"
              >
                <Upload size={14} /> Pilih Gambar Baru
              </label>
              {imageFile && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={handleUploadNewImage}
                  disabled={uploading}
                >
                  {uploading ? 'Mengunggah…' : 'Terapkan Gambar'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nama Lengkap Komponen *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kode SKU *</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) =>
                setFormData((p) => ({ ...p, sku: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-grid form-grid--3">
          <div className="form-group">
            <label className="form-label">Kategori *</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((p) => ({ ...p, type: e.target.value }))
              }
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
            <label className="form-label">Brand *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) =>
                setFormData((p) => ({ ...p, brand: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Harga (Rp) *</label>
            <input
              type="number"
              min="0"
              step="50000"
              value={formData.price}
              onChange={(e) =>
                setFormData((p) => ({ ...p, price: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-grid form-grid--3">
          <div className="form-group">
            <label className="form-label">Stok Gudang *</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData((p) => ({ ...p, stock: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Batas Minimum Stok *</label>
            <input
              type="number"
              value={formData.min_stock}
              onChange={(e) =>
                setFormData((p) => ({ ...p, min_stock: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lokasi Rak *</label>
            <input
              type="text"
              value={formData.rack_location}
              onChange={(e) =>
                setFormData((p) => ({ ...p, rack_location: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Deskripsi Komponen</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
            className="form-textarea"
          />
        </div>

        <div className="form-fieldset">
          <div className="fieldset-header">
            <label className="form-label">Spesifikasi Teknis</label>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={addSpec}
            >
              <Plus size={14} /> Tambah Spesifikasi
            </button>
          </div>
          <div className="multi-rows">
            {specs.map((spec, i) => (
              <div key={i} className="multi-row">
                <input
                  type="text"
                  placeholder="Parameter"
                  value={spec.name}
                  onChange={(e) => handleSpecChange(i, 'name', e.target.value)}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Nilai"
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

        <div className="form-fieldset">
          <div className="fieldset-header">
            <label className="form-label">SOP Penyimpanan Gudang</label>
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
            disabled={updating}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={updating}
          >
            {updating ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={showDraftModal}
        title="Pulihkan Draft Perubahan?"
        message="Terdapat draft perubahan yang belum disimpan. Ingin memulihkannya?"
        confirmLabel="Pulihkan"
        cancelLabel="Abaikan"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
