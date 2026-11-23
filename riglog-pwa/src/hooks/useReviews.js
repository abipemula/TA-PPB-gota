import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'

export function useReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await reviewService.getReviews(productId)
      if (response.success) {
        setReviews(response.data || [])
      } else {
        setError(response.message || 'Gagal memuat catatan audit.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat catatan.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, error, refetch: fetchReviews }
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (productId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      const response = await reviewService.createReview(productId, reviewData)
      if (response.success) {
        setSuccess(true)
        return response.data
      }
      setError(response.message || 'Gagal menyimpan catatan audit.')
      return null
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan catatan.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}
