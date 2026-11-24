import { apiClient } from '../config/api'
import { SITE_CONFIG } from '../config/siteConfig'

const SETTINGS_CACHE_KEY = 'riglog_settings_cache_v2'

const DEFAULT_SETTINGS = {
  profile: {
    username: 'Raka Pratama',
    role: 'Kepala Inventaris & QC Gudang',
    storeBranch: 'RigLog Hardware Hub — Cabang Utama',
    avatar: null,
    bio: 'Bertanggung jawab atas pencatatan stok masuk/keluar, audit nomor seri (S/N), dan pengelolaan katalog komponen PC rakitan.',
  },
  brandLogos: {},
  navIcons: {},
  socialMedia: SITE_CONFIG.socialMedia,
}

const normalizeSettings = (data = {}) => ({
  profile: { ...DEFAULT_SETTINGS.profile, ...(data.profile || {}) },
  brandLogos: data.brandLogos || {},
  navIcons: data.navIcons || {},
  socialMedia: Array.isArray(data.socialMedia)
    ? data.socialMedia
    : DEFAULT_SETTINGS.socialMedia,
})

export const readCachedSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY)
    if (raw) {
      return normalizeSettings(JSON.parse(raw))
    }
  } catch {
    // fallback
  }
  return structuredClone(DEFAULT_SETTINGS)
}

const writeCachedSettings = (data) => {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota error
  }
}

class SettingsService {
  async getSettings() {
    try {
      const data = await apiClient.get('/api/settings')
      const normalized = normalizeSettings(data)
      writeCachedSettings(normalized)
      return { success: true, data: normalized, source: 'api' }
    } catch {
      return { success: true, data: readCachedSettings(), source: 'offline' }
    }
  }

  async updateSettings(payload) {
    const updated = await apiClient.put('/api/settings', payload)
    const normalized = normalizeSettings(updated)
    writeCachedSettings(normalized)
    window.dispatchEvent(new Event('riglog-settings-updated'))
    return { success: true, data: normalized }
  }
}

export default new SettingsService()
