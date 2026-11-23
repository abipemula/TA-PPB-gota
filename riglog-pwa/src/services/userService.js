// ---------------------------------------------------------------------------
// userService.js — Identitas Operator Gudang & Profil di localStorage (Modul 5)
// ---------------------------------------------------------------------------

const USER_IDENTIFIER_KEY = 'riglog_operator_id'
const USER_PROFILE_KEY = 'riglog_operator_profile'

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str,
  )

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const getUserIdentifier = () => {
  try {
    let userId = localStorage.getItem(USER_IDENTIFIER_KEY)
    if (!userId || !isValidUUID(userId)) {
      userId = generateUUID()
      localStorage.setItem(USER_IDENTIFIER_KEY, userId)
    }
    return userId
  } catch {
    return generateUUID()
  }
}

export const getUserProfile = () => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return {
    username: 'Raka Pratama',
    role: 'Kepala Inventaris & QC Gudang',
    storeBranch: 'RigLog Hardware Hub — Cabang Utama',
    avatar: null,
    bio: 'Bertanggung jawab atas pencatatan stok masuk/keluar, audit nomor seri (S/N), dan pengelolaan katalog komponen PC rakitan.',
    userId: getUserIdentifier(),
  }
}

export const saveUserProfile = (profile) => {
  try {
    const data = {
      ...profile,
      userId: getUserIdentifier(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data))
    return { success: true, data }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export const updateAvatar = (avatarBase64) => {
  const profile = getUserProfile()
  profile.avatar = avatarBase64
  return saveUserProfile(profile)
}

export default {
  getUserIdentifier,
  getUserProfile,
  saveUserProfile,
  updateAvatar,
}
