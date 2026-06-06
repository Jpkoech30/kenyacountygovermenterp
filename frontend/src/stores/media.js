import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/axios'

/**
 * Media Store
 * Manages media file uploads, listing, and deletion.
 */
export const useMediaStore = defineStore('media', () => {
  // State
  const mediaList = ref([])
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 30,
    totalPages: 0,
  })
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const totalPages = computed(() => pagination.value.totalPages)

  /**
   * Fetch paginated media list with optional filters.
   */
  async function fetchMedia(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/media', { params })
      mediaList.value = response.data.media
      pagination.value = response.data.pagination
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch media.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload files to the server.
   * @param {File[]} files - Array of File objects
   * @returns {Promise<object[]>} - Array of uploaded media objects
   */
  async function uploadMedia(files) {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }

      const response = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Prepend new media to list
      mediaList.value = [...response.data.media, ...mediaList.value]
      pagination.value.total += response.data.media.length

      return response.data.media
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to upload media.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a media item (e.g., alt_text).
   * @param {number} id - Media ID
   * @param {object} data - Fields to update
   */
  async function updateMedia(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/media/${id}`, data)
      // Update in local list
      const index = mediaList.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        mediaList.value[index] = { ...mediaList.value[index], ...response.data.media }
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update media.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a media item.
   */
  async function deleteMedia(id) {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/media/${id}`)
      mediaList.value = mediaList.value.filter((m) => m.id !== id)
      pagination.value.total--
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete media.'
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
    mediaList,
    pagination,
    loading,
    error,
    // Getters
    totalItems,
    totalPages,
    // Actions
    fetchMedia,
    uploadMedia,
    updateMedia,
    deleteMedia,
    clearError,
  }
})
