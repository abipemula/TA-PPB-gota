import { apiClient, IS_SUPABASE } from '../config/api'

const LOCAL_REVIEWS_KEY = 'riglog_audit_reviews_v1'

const DEFAULT_REVIEWS = {
  '33333333-3333-4333-8333-333333333301': [
    {
      id: 'rev-101',
      product_id: '33333333-3333-4333-8333-333333333301',
      user_identifier: 'Raka (Kepala Gudang)',
      rating: 5,
      comment:
        'Batch terbaru segel resmi NJT aman. Pin pad LGA1718 bersih dan lolos inspeksi.',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ],
  '33333333-3333-4333-8333-333333333302': [
    {
      id: 'rev-102',
      product_id: '33333333-3333-4333-8333-333333333302',
      user_identifier: 'Dimas (Teknisi Rakitan)',
      rating: 5,
      comment:
        'Suhu full load di testbench 64°C, kipas Axial-tech senyap, adaptor 12VHPWR lengkap.',
      created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
  ],
}

const readLocalReviews = (productId) => {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY)
    const map = raw ? JSON.parse(raw) : DEFAULT_REVIEWS
    return map[String(productId)] || []
  } catch {
    return DEFAULT_REVIEWS[String(productId)] || []
  }
}

const writeLocalReview = (productId, newReview) => {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY)
    const map = raw ? JSON.parse(raw) : { ...DEFAULT_REVIEWS }
    const key = String(productId)
    const existing = map[key] || []
    map[key] = [newReview, ...existing]
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

class ReviewService {
  async getReviews(productId) {
    try {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          `/rest/v1/reviews?product_id=eq.${productId}&select=*&order=created_at.desc`,
        )
        return { success: true, data: Array.isArray(data) ? data : [] }
      }
    } catch {
      // fallback
    }
    return { success: true, data: readLocalReviews(productId) }
  }

  async createReview(productId, reviewData) {
    const newRecord = {
      id: `rev-${Date.now()}`,
      product_id: productId,
      user_identifier: reviewData.user_identifier || 'Auditor Gudang',
      rating: Number(reviewData.rating || 5),
      comment: reviewData.comment || '',
      created_at: new Date().toISOString(),
    }

    writeLocalReview(productId, newRecord)

    try {
      if (IS_SUPABASE) {
        const res = await apiClient.post(
          '/rest/v1/reviews',
          {
            product_id: productId,
            user_identifier: newRecord.user_identifier,
            rating: newRecord.rating,
            comment: newRecord.comment,
          },
          { headers: { Prefer: 'return=representation' } },
        )
        return { success: true, data: Array.isArray(res) ? res[0] : res }
      }
    } catch {
      // tetap sukses menggunakan local persistence
    }

    return { success: true, data: newRecord }
  }
}

export default new ReviewService()
