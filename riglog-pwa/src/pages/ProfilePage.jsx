import { useState } from 'react'
import {
  Shield,
  Copy,
  Check,
  Save,
  Bookmark,
  FileText,
  Camera,
  Play,
  Cpu,
  Server,
  Smartphone,
  Database,
  ImagePlus,
  RotateCcw,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useHardware } from '../hooks/useHardware'
import { BRAND_LOGOS } from '../config/siteConfig'

const getActiveDraftCount = () => {
  try {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('riglog_draft_') && !key.endsWith('_ts')) {
        count++
      }
    }
    return count
  } catch {
    return 0
  }
}

/**
 * ProfilePage — Halaman 5: Halaman Profile Operator & About Aplikasi RigLog.
 * Memenuhi syarat wajib Tugas Akhir: Memiliki 1 halaman Profile / About aplikasi.
 */
export default function ProfilePage({ onReplaySplash }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Raka Pratama')
  const [role, setRole] = useState(
    profile.role || 'Kepala Inventaris & QC Gudang',
  )
  const [storeBranch, setStoreBranch] = useState(
    profile.storeBranch || 'RigLog Hardware Hub — Cabang Utama',
  )
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()
  const { items: products } = useHardware()
  const [draftCount] = useState(getActiveDraftCount)

  const [customBrandLogos, setCustomBrandLogos] = useState(() => {
    try {
      const raw = localStorage.getItem('riglog_brand_logos_v1')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const brandNames = Array.from(
    new Set([
      ...Object.keys(BRAND_LOGOS),
      ...products.map((p) => (p.brand || '').trim()).filter(Boolean),
    ]),
  )

  const handleBrandLogoUpload = (brandName, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Ukuran logo brand maksimal 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result
      if (!dataUrl) return
      setCustomBrandLogos((prev) => {
        const next = { ...prev, [brandName]: dataUrl }
        localStorage.setItem('riglog_brand_logos_v1', JSON.stringify(next))
        return next
      })
      setFeedback(`Logo brand "${brandName}" berhasil diperbarui!`)
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleResetBrandLogo = (brandName) => {
    setCustomBrandLogos((prev) => {
      const next = { ...prev }
      delete next[brandName]
      localStorage.setItem('riglog_brand_logos_v1', JSON.stringify(next))
      return next
    })
    setFeedback(`Logo brand "${brandName}" dikembalikan ke default.`)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Ukuran gambar avatar maksimal 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Foto profil operator berhasil diperbarui.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const updated = {
      ...profile,
      username: username.trim() || 'Operator Gudang',
      role: role.trim() || 'Staf Inventaris',
      storeBranch: storeBranch.trim() || 'RigLog Hardware Hub',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setProfile(result.data)
      setFeedback('Profil operator berhasil disimpan!')
      setTimeout(() => setFeedback(''), 3000)
    } else {
      setFeedback('Gagal menyimpan profil.')
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead">
        <div className="masthead-top-row">
          <div>
            <h1 className="display">Profil Operator &amp; Tentang RigLog</h1>
            <p className="lede">
              Identitas otorisasi petugas inventaris gudang, statistik lokal perangkat, serta informasi arsitektur aplikasi Tugas Akhir PPB.
            </p>
          </div>
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
            >
              <Play size={14} /> Putar Ulang Splash Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Kartu Identitas Operator Gudang */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img
                src={avatar}
                alt={profile.username}
                className="avatar-img"
              />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--accent)" />
              </div>
            )}
            <label
              htmlFor="avatar-file-input"
              className="avatar-upload-btn"
              title="Unggah foto profil"
            >
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username}</h2>
            <p className="type">
              {profile.role} · <strong>{profile.storeBranch}</strong>
            </p>
            <div className="profile-id-row">
              <span className="mono-badge">UUID: {profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Salin UUID Operator"
              >
                {copied ? (
                  <Check size={14} color="var(--accent)" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <Bookmark size={20} stroke="var(--accent)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Item di Watchlist</div>
          </div>
          <div className="stat-item">
            <FileText size={20} stroke="var(--steel)" />
            <div className="stat-val">{draftCount}</div>
            <div className="stat-label">Draft Form Tersimpan</div>
          </div>
        </div>
      </div>

      {/* Form Edit Profil */}
      <form onSubmit={handleSaveProfile} className="profile-form">
        <h3 className="section-title">Pengaturan Identitas Petugas Gudang</h3>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="prof-name" className="form-label">
              Nama Lengkap Petugas
            </label>
            <input
              id="prof-name"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="prof-role" className="form-label">
              Jabatan / Divisi
            </label>
            <input
              id="prof-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="prof-branch" className="form-label">
            Lokasi Gudang / Cabang Toko
          </label>
          <input
            id="prof-branch"
            type="text"
            value={storeBranch}
            onChange={(e) => setStoreBranch(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">
            Catatan Tugas &amp; Tanggung Jawab Operasional
          </label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="form-textarea"
          />
        </div>

        <button type="submit" className="btn btn--primary">
          <Save size={16} /> Simpan Profil Operator
        </button>
      </form>

      {/* Pengaturan Logo Brand untuk Shop by Brand */}
      <section className="detail-section">
        <h2>Pengaturan Logo Brand (Shop by Brand)</h2>
        <p className="lede" style={{ maxWidth: '100%', marginBottom: '16px' }}>
          Unggah gambar logo untuk setiap brand manufaktur di sini. Perubahan akan langsung tampil pada bagian <strong>Shop by Brand</strong> di halaman Katalog tanpa menampilkan tombol edit di halaman depan.
        </p>

        <div className="brand-settings-grid">
          {brandNames.map((brandName) => {
            const logoSrc = customBrandLogos[brandName] || BRAND_LOGOS[brandName]
            const isCustom = Boolean(customBrandLogos[brandName])
            const inputId = `settings-brand-${brandName.replace(/[^a-zA-Z0-9]/g, '-')}`
            return (
              <div key={brandName} className="brand-setting-card">
                <div className="brand-tile__logo-wrap">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`Logo ${brandName}`}
                      className="brand-tile__logo"
                    />
                  ) : (
                    <span className="type">Belum ada logo</span>
                  )}
                </div>
                <strong className="brand-setting-card__name">{brandName}</strong>
                <div className="brand-setting-card__actions">
                  <label htmlFor={inputId} className="btn btn--outline btn--sm">
                    <ImagePlus size={14} /> Upload
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={(e) => handleBrandLogoUpload(brandName, e)}
                    />
                  </label>
                  {isCustom && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleResetBrandLogo(brandName)}
                      title="Kembalikan ke logo default"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bagian About Aplikasi (Wajib Sesuai Ketentuan Tugas Akhir) */}
      <section className="detail-section">
        <h2>Tentang Aplikasi — RigLog System</h2>
        <p className="lede" style={{ maxWidth: '100%', marginBottom: '18px' }}>
          <strong>RigLog</strong> adalah{' '}
          <em>
            Sistem inventaris terintegrasi untuk pencatatan, pemantauan stok, dan pengelolaan katalog komponen komputer pada toko hardware
          </em>
          . Aplikasi ini dirancang sebagai Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) Ganjil 2026.
        </p>

        <div className="about-tech-grid">
          <div className="about-tech-card">
            <Server size={20} color="#38bdf8" />
            <h4>RESTful API (Modul 1)</h4>
            <p>
              Backend dibangun menggunakan Node.js &amp; Express.js dengan arsitektur MVC (<code>models</code>, <code>controllers</code>, <code>routes</code>).
            </p>
          </div>
          <div className="about-tech-card">
            <Database size={20} color="#10b981" />
            <h4>Supabase PostgreSQL</h4>
            <p>
              Penyimpanan relasional tabel <code>categories</code>, <code>suppliers</code>, <code>products</code>, dan <code>stock_logs</code>.
            </p>
          </div>
          <div className="about-tech-card">
            <Smartphone size={20} color="#f59e0b" />
            <h4>React + Vite PWA (Modul 4 &amp; 5)</h4>
            <p>
              Dilengkapi Web App Manifest, Service Worker Workbox, Offline Cache Fallback, dan dapat di-install ke Home Screen.
            </p>
          </div>
          <div className="about-tech-card">
            <Cpu size={20} color="#a855f7" />
            <h4>Custom Hooks &amp; Persistence</h4>
            <p>
              Menggunakan Axios Interceptors, Custom Hooks (<code>useHardware</code>, <code>useStockLogs</code>, <code>useFavorites</code>), dan Auto-Save Draft.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
