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

    const dataUrl = await fileToDataUrl(file)

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
