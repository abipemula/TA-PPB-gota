import axios from 'axios'

// ---------------------------------------------------------------------------
// Konfigurasi Axios Client — Memanggil Express RESTful API Buatan Sendiri
// (Sesuai Kriteria 1 & Modul 1: Frontend -> Express Backend -> PostgreSQL)
// ---------------------------------------------------------------------------
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '')

const ADMIN_TOKEN_KEY = 'riglog_admin_token'

export const getStoredAdminToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export const setStoredAdminToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
})

// Request interceptor — sisipkan token Admin & cegah cache basi
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAdminToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    if ((config.method || 'get').toLowerCase() === 'get') {
      config.params = {
        ...(config.params || {}),
        _t: Date.now(),
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — ekstrak response.data & normalisasi error
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Terjadi kesalahan saat menghubungi server RigLog API.'
    let status = null
    let isNetworkError = false

    if (error.response) {
      status = error.response.status
      message =
        error.response.data?.error ||
        error.response.data?.message ||
        `Server error (${status})`
    } else if (error.request) {
      isNetworkError = true
      message =
        'Backend RigLog API tidak terjangkau. Pastikan server riglog-api sedang berjalan.'
    } else {
      message = error.message || message
    }

    return Promise.reject({
      message,
      status,
      isNetworkError,
      raw: error.response?.data,
    })
  },
)

export { apiClient, BASE_URL, ADMIN_TOKEN_KEY }
