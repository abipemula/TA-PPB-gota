import { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  Lock,
  LogOut,
  Copy,
  Check,
  Save,
  ShoppingCart,
  FileText,
  Camera,
  Play,
  Cpu,
  Server,
  Smartphone,
  Database,
  ImagePlus,
  RotateCcw,
  AlertCircle,
  Link2,
  Navigation,
  X,
} from 'lucide-react'
import userService from '../services/userService'
import authService from '../services/authService'
import settingsService, { readCachedSettings } from '../services/settingsService'
import uploadService from '../services/uploadService'
import { useFavorites } from '../hooks/useFavorites'
import { useHardware } from '../hooks/useHardware'
import { BRAND_LOGOS, SITE_CONFIG } from '../config/siteConfig'
import { BOTTOM_TABS, NAV_ICON_CATALOG } from '../components/BottomNav'

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

const NAV_ICON_CHOICES = Object.keys(NAV_ICON_CATALOG)

/**
 * ProfilePage — Halaman 5: Profil Toko/Admin & About Aplikasi RigLog.
 * Pengunjung biasa hanya melihat profil (read-only) & About.
 * Hanya Admin (login password) yang dapat mengedit profil, logo brand,
 * ikon bottom navbar, dan tautan media sosial prodi.
 */
export default function ProfilePage({ isAdmin, onAuthChange, onReplaySplash }) {
  const initialSettings = readCachedSettings()
  const [profile, setProfile] = useState(() => ({
    ...initialSettings.profile,
    userId: userService.getUserIdentifier(),
  }))
  const [username, setUsername] = useState(profile.username || 'Raka Pratama')
  const [role, setRole] = useState(
    profile.role || 'Kepala Inventaris & QC Gudang',
  )
  const [storeBranch, setStoreBranch] = useState(
    profile.storeBranch || 'RigLog Hardware Hub — Cabang Utama',
  )
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [customBrandLogos, setCustomBrandLogos] = useState(
    initialSettings.brandLogos || {},
  )
  const [navIcons, setNavIcons] = useState(initialSettings.navIcons || {})
  const [socialMedia, setSocialMedia] = useState(
    initialSettings.socialMedia || SITE_CONFIG.socialMedia,
  )

  // State panel terpisah untuk Upload / Reset Logo Brand (Gambar 3)
  const [brandActionMode, setBrandActionMode] = useState(null) // null | 'upload' | 'reset'
  const [selectedBrand, setSelectedBrand] = useState('')

  const [passwordInput, setPasswordInput] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingSocials, setSavingSocials] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { favorites } = useFavorites()
  const { items: products } = useHardware()
  const [draftCount] = useState(getActiveDraftCount)

  useEffect(() => {
    settingsService.getSettings().then((res) => {
      if (res?.success && res?.data) {
        const p = res.data.profile || {}
        setProfile({ ...p, userId: userService.getUserIdentifier() })
        setUsername(p.username || 'Raka Pratama')
        setRole(p.role || 'Kepala Inventaris & QC Gudang')
        setStoreBranch(p.storeBranch || 'RigLog Hardware Hub — Cabang Utama')
        setBio(p.bio || '')
        setAvatar(p.avatar || null)
        setCustomBrandLogos(res.data.brandLogos || {})
        setNavIcons(res.data.navIcons || {})
        if (Array.isArray(res.data.socialMedia)) {
          setSocialMedia(res.data.socialMedia)
        }
      }
    })
  }, [])

  const brandNames = Array.from(
    new Set([
      ...Object.keys(BRAND_LOGOS),
      ...products.map((p) => (p.brand || '').trim()).filter(Boolean),
    ]),
  )

  const activeTargetBrand = selectedBrand || brandNames[0] || ''

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 3500)
    } else {
      setFeedback(msg)
      setTimeout(() => setFeedback(''), 3500)
    }
  }

  const handleLoginAdmin = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      setAuthLoading(true)
      await authService.login(passwordInput)
      setPasswordInput('')
      if (onAuthChange) onAuthChange(true)
      showToast('Berhasil masuk Mode Admin! Seluruh fitur edit & kelola stok kini aktif.')
    } catch (err) {
      setAuthError(err.message || 'Password admin salah.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogoutAdmin = () => {
    authService.logout()
    if (onAuthChange) onAuthChange(false)
    showToast('Keluar dari Mode Admin. Aplikasi kembali ke mode tampilan publik.')
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = async (e) => {
    if (!isAdmin) return
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran gambar avatar maksimal 2MB.', true)
      return
    }
    try {
      const uploaded = await uploadService.uploadImage(file)
      const url = uploaded.data?.url
      if (url) {
        setAvatar(url)
        await settingsService.updateSettings({
          profile: { ...profile, avatar: url },
        })
        setProfile((p) => ({ ...p, avatar: url }))
        showToast('Foto profil admin berhasil diperbarui & tersimpan ke server.')
      }
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah foto profil.', true)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    try {
      setSaving(true)
      const updatedProfile = {
        username: username.trim() || 'Admin Gudang',
        role: role.trim() || 'Kepala Inventaris',
        storeBranch: storeBranch.trim() || 'RigLog Hardware Hub',
        bio: bio.trim(),
        avatar,
      }
      const res = await settingsService.updateSettings({
        profile: updatedProfile,
      })
      setProfile({
        ...res.data.profile,
        userId: userService.getUserIdentifier(),
      })
      userService.saveUserProfile(updatedProfile)
      showToast('Profil admin berhasil disimpan ke database!')
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan profil admin.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleBrandLogoUpload = async (brandName, e) => {
    if (!isAdmin || !brandName) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran logo brand maksimal 2MB.', true)
      return
    }
    try {
      const uploaded = await uploadService.uploadImage(file)
      const logoUrl = uploaded.data?.url
      if (!logoUrl) return
      const nextLogos = { ...customBrandLogos, [brandName]: logoUrl }
      await settingsService.updateSettings({ brandLogos: nextLogos })
      setCustomBrandLogos(nextLogos)
      setBrandActionMode(null)
      showToast(`Logo brand "${brandName}" berhasil diperbarui untuk semua pengguna!`)
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah logo brand.', true)
    }
  }

  const handleResetBrandLogo = async (brandName) => {
    if (!isAdmin || !brandName) return
    try {
      const nextLogos = { ...customBrandLogos }
      delete nextLogos[brandName]
      await settingsService.updateSettings({ brandLogos: nextLogos })
      setCustomBrandLogos(nextLogos)
      showToast(`Logo brand "${brandName}" dikembalikan ke default.`)
    } catch (err) {
      showToast(err.message || 'Gagal mereset logo brand.', true)
    }
  }

  const handleResetAllBrandLogos = async () => {
    if (!isAdmin) return
    try {
      await settingsService.updateSettings({ brandLogos: {} })
      setCustomBrandLogos({})
      setBrandActionMode(null)
      showToast('Seluruh logo brand berhasil dikembalikan ke default.')
    } catch (err) {
      showToast(err.message || 'Gagal mereset semua logo brand.', true)
    }
  }

  // Handler kustomisasi ikon Bottom Navbar (Gambar 2)
  const handleSelectNavIconPreset = async (tabId, iconName) => {
    if (!isAdmin) return
    try {
      const nextIcons = { ...navIcons, [tabId]: iconName }
      await settingsService.updateSettings({ navIcons: nextIcons })
      setNavIcons(nextIcons)
      showToast(`Ikon navbar "${tabId}" berhasil diperbarui!`)
    } catch (err) {
      showToast(err.message || 'Gagal mengubah ikon navbar.', true)
    }
  }

  const handleUploadNavIcon = async (tabId, e) => {
    if (!isAdmin) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      showToast('Ukuran ikon navbar maksimal 1MB.', true)
      return
    }
    try {
      const uploaded = await uploadService.uploadImage(file)
      const url = uploaded.data?.url
      if (!url) return
      const nextIcons = { ...navIcons, [tabId]: url }
      await settingsService.updateSettings({ navIcons: nextIcons })
      setNavIcons(nextIcons)
      showToast(`Ikon gambar navbar "${tabId}" berhasil diterapkan!`)
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah ikon navbar.', true)
    }
  }

  const handleResetNavIcon = async (tabId) => {
    if (!isAdmin) return
    try {
      const nextIcons = { ...navIcons }
      delete nextIcons[tabId]
      await settingsService.updateSettings({ navIcons: nextIcons })
      setNavIcons(nextIcons)
      showToast(`Ikon navbar "${tabId}" dikembalikan ke default.`)
    } catch (err) {
      showToast(err.message || 'Gagal mereset ikon navbar.', true)
    }
  }

  // Handler edit link media sosial Prodi (tersimpan ke database /api/settings)
  const handleSocialChange = (index, field, value) => {
    setSocialMedia((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSaveSocialMedia = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    try {
      setSavingSocials(true)
      await settingsService.updateSettings({ socialMedia })
      showToast('Tautan media sosial prodi berhasil disimpan & langsung aktif di Footer!')
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan tautan media sosial.', true)
    } finally {
      setSavingSocials(false)
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead">
        <div className="masthead-top-row">
          <div>
            <h1 className="display">Profil Pengelola &amp; Tentang RigLog</h1>
            <p className="lede">
              Informasi pengelola toko hardware, kontrol akses Admin berbasis password, serta detail arsitektur aplikasi PWA.
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
      {errorMsg && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Kartu Profil Toko / Pengelola (Read-Only untuk Pengunjung) */}
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
            {isAdmin && (
              <label
                htmlFor="avatar-file-input"
                className="avatar-upload-btn"
                title="Unggah foto profil admin"
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
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username}</h2>
            <p className="type">
              {profile.role} · <strong>{profile.storeBranch}</strong>
            </p>
            {profile.bio && (
              <p className="lede" style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                {profile.bio}
              </p>
            )}
            <div className="profile-id-row">
              <span className="mono-badge">Device ID: {profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Salin Device ID"
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
            <ShoppingCart size={20} stroke="var(--accent)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Item di Keranjang</div>
          </div>
          <div className="stat-item">
            <FileText size={20} stroke="var(--steel)" />
            <div className="stat-val">{draftCount}</div>
            <div className="stat-label">Draft Form Tersimpan</div>
          </div>
        </div>
      </div>

      {/* Panel Otorisasi Admin (Password Protected) */}
      {!isAdmin ? (
        <section className="detail-section admin-login-box">
          <h2>
            <Lock size={17} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Akses Khusus Admin Gudang
          </h2>
          <p className="lede" style={{ maxWidth: '100%', marginBottom: '14px' }}>
            Untuk menjaga keamanan data katalog dan profil toko saat aplikasi digunakan publik, hanya <strong>Admin</strong> yang dapat mengubah profil, logo brand, ikon navigasi, link media sosial, menambah/mengedit komponen, dan mencatat mutasi stok.
          </p>

          <form onSubmit={handleLoginAdmin} className="admin-login-form">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="admin-pass" className="form-label">
                Masukkan Password Admin
              </label>
              <input
                id="admin-pass"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password admin..."
                className="form-input"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={authLoading}
            >
              <ShieldCheck size={16} />{' '}
              {authLoading ? 'Memverifikasi…' : 'Masuk Mode Admin'}
            </button>
          </form>

          {authError && (
            <p className="form-error" style={{ marginTop: '8px', color: 'var(--accent)', fontSize: '0.84rem', fontWeight: 600 }}>
              {authError}
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="admin-badge-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#059669" />
              <div>
                <strong>Mode Admin Aktif</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
                  Anda memiliki otoritas penuh untuk mengedit profil, logo brand, ikon navbar, tautan sosmed, katalog, dan mutasi stok.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleLogoutAdmin}
            >
              <LogOut size={14} /> Keluar Mode Admin
            </button>
          </div>

          {/* Form Edit Profil (Khusus Admin) */}
          <form onSubmit={handleSaveProfile} className="profile-form">
            <h3 className="section-title">Edit Identitas Pengelola / Admin Toko</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="prof-name" className="form-label">
                  Nama Lengkap Admin
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

            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Menyimpan…' : 'Simpan Profil Admin'}
            </button>
          </form>

          {/* Pengaturan Logo Brand — Tombol Upload & Reset Terpisah di Bawah (Gambar 3) */}
          <section className="detail-section">
            <h2>Pengaturan Logo Brand (Shop by Brand)</h2>
            <p className="lede" style={{ maxWidth: '100%', marginBottom: '16px' }}>
              Daftar logo brand yang aktif di halaman depan. Gunakan tombol <strong>Upload Logo</strong> atau <strong>Reset Logo</strong> di bawah untuk memilih brand yang ingin diubah.
            </p>

            <div className="brand-settings-grid">
              {brandNames.map((brandName) => {
                const logoSrc =
                  customBrandLogos[brandName] || BRAND_LOGOS[brandName]
                const isCustom = Boolean(customBrandLogos[brandName])
                const isPicked = activeTargetBrand === brandName
                return (
                  <button
                    key={brandName}
                    type="button"
                    className={`brand-setting-card${isPicked && brandActionMode ? ' brand-setting-card--selected' : ''}`}
                    onClick={() => setSelectedBrand(brandName)}
                  >
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
                    <strong className="brand-setting-card__name">
                      {brandName}
                    </strong>
                    <span className="type" style={{ fontSize: '0.72rem' }}>
                      {isCustom ? 'Logo Kustom' : 'Logo Default'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 2 Tombol Terpisah di Bawah Grid */}
            <div className="brand-action-bar">
              <button
                type="button"
                className={`btn ${brandActionMode === 'upload' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() =>
                  setBrandActionMode((m) => (m === 'upload' ? null : 'upload'))
                }
              >
                <ImagePlus size={16} /> Upload Logo Brand
              </button>
              <button
                type="button"
                className={`btn ${brandActionMode === 'reset' ? 'btn--danger' : 'btn--outline'}`}
                onClick={() =>
                  setBrandActionMode((m) => (m === 'reset' ? null : 'reset'))
                }
              >
                <RotateCcw size={16} /> Reset Logo Brand
              </button>
            </div>

            {/* Panel Pilih Brand untuk Upload */}
            {brandActionMode === 'upload' && (
              <div className="brand-action-panel">
                <div className="brand-action-panel__head">
                  <strong>Pilih Brand untuk Upload Logo Baru</strong>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setBrandActionMode(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="brand-action-panel__row">
                  <select
                    className="form-select"
                    value={activeTargetBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    style={{ maxWidth: '260px' }}
                  >
                    {brandNames.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="bulk-brand-upload" className="btn btn--primary btn--sm">
                    <ImagePlus size={15} /> Pilih Gambar untuk {activeTargetBrand}
                    <input
                      id="bulk-brand-upload"
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={(e) => handleBrandLogoUpload(activeTargetBrand, e)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Panel Pilih Brand untuk Reset */}
            {brandActionMode === 'reset' && (
              <div className="brand-action-panel">
                <div className="brand-action-panel__head">
                  <strong>Pilih Brand untuk Dikembalikan ke Logo Default</strong>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setBrandActionMode(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="brand-action-panel__row">
                  <select
                    className="form-select"
                    value={activeTargetBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    style={{ maxWidth: '260px' }}
                  >
                    {brandNames.map((b) => (
                      <option key={b} value={b}>
                        {b} {customBrandLogos[b] ? '(Kustom)' : '(Default)'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleResetBrandLogo(activeTargetBrand)}
                  >
                    <RotateCcw size={14} /> Reset {activeTargetBrand}
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={handleResetAllBrandLogos}
                  >
                    Reset Semua Logo
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Pengaturan Ikon Bottom Navbar (Gambar 2) */}
          <section className="detail-section">
            <h2>
              <Navigation size={17} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Pengaturan Ikon Bottom Navbar
            </h2>
            <p className="lede" style={{ maxWidth: '100%', marginBottom: '16px' }}>
              Pilih ikon preset atau unggah gambar ikon kustom untuk setiap tab navigasi di bawah layar.
            </p>

            <div className="nav-icon-picker-grid">
              {BOTTOM_TABS.map((tab) => {
                const currentVal = navIcons[tab.id] || tab.defaultIcon
                const isCustomImg =
                  typeof currentVal === 'string' &&
                  (currentVal.startsWith('http') ||
                    currentVal.startsWith('/') ||
                    currentVal.startsWith('data:image'))
                const PreviewIcon =
                  (!isCustomImg && NAV_ICON_CATALOG[currentVal]) ||
                  NAV_ICON_CATALOG[tab.defaultIcon] ||
                  Cpu
                const navInputId = `nav-icon-upload-${tab.id}`

                return (
                  <div key={tab.id} className="nav-icon-setting-card">
                    <div className="nav-icon-setting-card__head">
                      <span className="nav-icon-preview">
                        {isCustomImg ? (
                          <img
                            src={currentVal}
                            alt={tab.label}
                            className="bottom-nav__custom-img"
                          />
                        ) : (
                          <PreviewIcon size={20} color="var(--accent)" />
                        )}
                      </span>
                      <strong>{tab.label}</strong>
                    </div>

                    <select
                      className="form-select"
                      value={isCustomImg ? tab.defaultIcon : currentVal}
                      onChange={(e) =>
                        handleSelectNavIconPreset(tab.id, e.target.value)
                      }
                    >
                      {NAV_ICON_CHOICES.map((iconKey) => (
                        <option key={iconKey} value={iconKey}>
                          Ikon: {iconKey}
                        </option>
                      ))}
                    </select>

                    <div className="brand-setting-card__actions">
                      <label htmlFor={navInputId} className="btn btn--outline btn--sm">
                        <ImagePlus size={13} /> Upload
                        <input
                          id={navInputId}
                          type="file"
                          accept="image/*"
                          className="hidden-file-input"
                          onChange={(e) => handleUploadNavIcon(tab.id, e)}
                        />
                      </label>
                      {navIcons[tab.id] && (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => handleResetNavIcon(tab.id)}
                        >
                          <RotateCcw size={13} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Pengaturan Tautan Media Sosial Prodi (Editable di Mode Admin) */}
          <form onSubmit={handleSaveSocialMedia} className="profile-form">
            <h3 className="section-title">
              <Link2 size={17} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Edit Tautan Media Sosial Prodi (Footer)
            </h3>
            <p className="lede" style={{ maxWidth: '100%' }}>
              Ubah nama, handle, dan URL tautan media sosial program studi di sini. Nilai default di kode tersimpan di <code>riglog-pwa/src/config/siteConfig.js</code> dan perubahan Admin disimpan ke database lewat <code>PUT /api/settings</code>.
            </p>

            <div className="multi-rows">
              {socialMedia.map((sos, idx) => (
                <div key={sos.id || idx} className="social-edit-row">
                  <div className="form-group">
                    <label className="form-label">Nama Platform</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sos.name || ''}
                      onChange={(e) =>
                        handleSocialChange(idx, 'name', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Handle / Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sos.handle || ''}
                      onChange={(e) =>
                        handleSocialChange(idx, 'handle', e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL Tautan</label>
                    <input
                      type="url"
                      className="form-input"
                      value={sos.url || ''}
                      onChange={(e) =>
                        handleSocialChange(idx, 'url', e.target.value)
                      }
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={savingSocials}
            >
              <Save size={16} />{' '}
              {savingSocials ? 'Menyimpan…' : 'Simpan Tautan Media Sosial'}
            </button>
          </form>
        </>
      )}

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
            <Server size={20} color="#ec1c24" />
            <h4>Express RESTful API (Modul 1)</h4>
            <p>
              Frontend hanya berkomunikasi dengan backend API buatan sendiri (Node.js + Express.js) berarsitektur MVC.
            </p>
          </div>
          <div className="about-tech-card">
            <Database size={20} color="#059669" />
            <h4>PostgreSQL (Neon / Supabase)</h4>
            <p>
              Backend membaca &amp; menulis data relasional pada tabel <code>categories</code>, <code>suppliers</code>, <code>products</code>, dan <code>stock_logs</code>.
            </p>
          </div>
          <div className="about-tech-card">
            <Smartphone size={20} color="#2563eb" />
            <h4>React + Vite PWA (Modul 4 &amp; 5)</h4>
            <p>
              Dilengkapi Web App Manifest, Service Worker Workbox, tombol Install App, dan navigasi bawah mobile-first.
            </p>
          </div>
          <div className="about-tech-card">
            <Cpu size={20} color="#7c3aed" />
            <h4>Role Access Control</h4>
            <p>
              Dilindungi otorisasi Admin berbasis password agar pengunjung umum hanya melihat katalog sementara perubahan data terkontrol.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
