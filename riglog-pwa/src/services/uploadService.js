import { apiClient } from '../config/api'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Kompres & resize gambar raster di sisi browser sebelum disimpan ke database
 * agar ukuran payload sangat ringan (~40–90 KB) dan loading katalog/watchlist jauh lebih cepat.
 */
const compressImageToDataUrl = async (file, maxDimension = 768, quality = 0.78) => {
  if (file.type === 'image/svg+xml') {
    return fileToDataUrl(file)
  }

  try {
    const rawDataUrl = await fileToDataUrl(file)
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = rawDataUrl
    })

    let { width, height } = img
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width)
        width = maxDimension
      } else {
        width = Math.round((width * maxDimension) / height)
        height = maxDimension
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return rawDataUrl

    ctx.drawImage(img, 0, 0, width, height)

    // Coba WebP dulu (ringan & mendukung transparansi), fallback ke JPEG jika browser tidak support
    const webpUrl = canvas.toDataURL('image/webp', quality)
    if (webpUrl.startsWith('data:image/webp') && webpUrl.length < rawDataUrl.length) {
      return webpUrl
    }

    const jpegUrl = canvas.toDataURL('image/jpeg', quality)
    return jpegUrl.length < rawDataUrl.length ? jpegUrl : rawDataUrl
  } catch {
    return fileToDataUrl(file)
  }
}

class UploadService {
  async uploadImage(file) {
    if (!file) {
      throw new Error('Pilih file gambar terlebih dahulu.')
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Format file harus .jpg, .jpeg, .png, .webp, atau .svg')
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Ukuran gambar maksimal 5 MB.')
    }

    const dataUrl = await compressImageToDataUrl(file)

    // Upload lewat Express API buatan sendiri (/api/upload)
    const res = await apiClient.post('/api/upload', {
      dataUrl,
      filename: file.name,
    })
    if (res?.success && res?.data?.url) {
      return res
    }
    throw new Error('Gagal mengunggah gambar ke server.')
  }
}

export default new UploadService()
