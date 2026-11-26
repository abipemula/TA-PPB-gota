import {
  apiClient,
  getStoredAdminToken,
  setStoredAdminToken,
} from '../config/api'

class AuthService {
  isLoggedIn() {
    return Boolean(getStoredAdminToken())
  }

  async login(password) {
    const res = await apiClient.post('/api/auth/login', { password })
    if (res?.success && res?.token) {
      setStoredAdminToken(res.token)
      window.dispatchEvent(new Event('riglog-auth-changed'))
      return { success: true, role: 'admin' }
    }
    throw new Error(res?.error || 'Login admin gagal.')
  }

  logout() {
    setStoredAdminToken('')
    window.dispatchEvent(new Event('riglog-auth-changed'))
  }

  async verify() {
    const token = getStoredAdminToken()
    if (!token) return false
    // Saat mode offline (termasuk setelah refresh browser tanpa internet), pertahankan sesi Admin
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true
    }
    try {
      const res = await apiClient.get('/api/auth/verify')
      if (!res?.valid) {
        this.logout()
        return false
      }
      return true
    } catch {
      return Boolean(token)
    }
  }
}

export default new AuthService()
