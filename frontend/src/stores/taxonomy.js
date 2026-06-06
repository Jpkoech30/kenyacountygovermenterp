import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/axios'

/**
 * Taxonomy Store
 * Manages categories and tags for content classification.
 * Includes client-side caching with 5-minute TTL to reduce API calls.
 */
export const useTaxonomyStore = defineStore('taxonomy', () => {
  // State
  const taxonomies = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastFetched = ref(null)
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Getters
  const categories = computed(() =>
    taxonomies.value.filter((t) => t.type === 'category')
  )
  const tags = computed(() =>
    taxonomies.value.filter((t) => t.type === 'tag')
  )

  /** Whether the cached data is still fresh */
  function isCacheValid() {
    if (!lastFetched.value || taxonomies.value.length === 0) return false
    return Date.now() - lastFetched.value < CACHE_TTL
  }

  /**
   * Fetch all taxonomies with optional type filter.
   * Uses client-side cache to avoid redundant API calls.
   */
  async function fetchTaxonomies(params = {}) {
    // Return cached data if still fresh and no specific params
    if (isCacheValid() && Object.keys(params).length === 0) {
      return
    }
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/taxonomies', { params })
      taxonomies.value = response.data.taxonomies
      lastFetched.value = Date.now()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch taxonomies.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Invalidate cache (call after create/update/delete) */
  function invalidateCache() {
    lastFetched.value = null
  }

  /**
   * Create a new taxonomy.
   */
  async function createTaxonomy(data) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/taxonomies', data)
      taxonomies.value.push(response.data.taxonomy)
      return response.data.taxonomy
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create taxonomy.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing taxonomy.
   */
  async function updateTaxonomy(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/taxonomies/${id}`, data)
      const index = taxonomies.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        taxonomies.value[index] = response.data.taxonomy
      }
      return response.data.taxonomy
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update taxonomy.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a taxonomy.
   */
  async function deleteTaxonomy(id) {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/taxonomies/${id}`)
      taxonomies.value = taxonomies.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete taxonomy.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    taxonomies,
    loading,
    error,
    // Getters
    categories,
    tags,
    // Actions
    fetchTaxonomies,
    createTaxonomy,
    updateTaxonomy,
    deleteTaxonomy,
    clearError,
  }
})
