const LOCAL_REVIEWS_KEY = 'riglog_audit_reviews_v1'

class ReviewService {
  async getReviews(productId) {
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY)
      const map = raw ? JSON.parse(raw) : {}
      return { success: true, data: map[String(productId)] || [] }
    } catch {
      return { success: true, data: [] }
    }
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
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY)
      const map = raw ? JSON.parse(raw) : {}
      const key = String(productId)
      map[key] = [newRecord, ...(map[key] || [])]
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(map))
    } catch {
      // ignore
    }
    return { success: true, data: newRecord }
  }
}

export default new ReviewService()
