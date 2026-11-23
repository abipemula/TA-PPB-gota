import axios from 'axios'
import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'

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

    // 1. Jika menggunakan Supabase Storage (Cloud)
    if (IS_SUPABASE) {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `hw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`
      const bucketName = 'hardware'

      try {
        const uploadUrl = `${BASE_URL}/storage/v1/object/${bucketName}/${fileName}`
        await axios.post(uploadUrl, file, {
          headers: {
            'Content-Type': file.type,
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          timeout: 20000,
        })
        const publicUrl = `${BASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`
        return {
          success: true,
          data: { url: publicUrl, filename: fileName },
        }
      } catch {
        // Lanjut fallback ke Base64 Data URL
      }
    }

    const dataUrl = await fileToDataUrl(file)

    // 2. Simpan gambar ke disk lokal lewat riglog-api (/api/upload)
    if (BASE_URL && !IS_SUPABASE) {
      try {
        const res = await axios.post(
          `${BASE_URL}/api/upload`,
          { dataUrl, filename: file.name },
          { timeout: 15000 },
        )
        if (res.data?.success && res.data?.data?.url) {
          return res.data
        }
      } catch {
        // Jika backend sedang mati, fallback ke Base64 Data URL agar tetap tersimpan di localStorage
      }
    }

    return {
      success: true,
      data: { url: dataUrl, filename: file.name },
    }
  }
}

export default new UploadService()
