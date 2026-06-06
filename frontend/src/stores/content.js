import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/axios'

/**
 * Content Store
 * Manages CMS content items, including CRUD, workflow actions, versions, and AI summarisation.
 */
export const useContentStore = defineStore('content', () => {
  // State
  const contentList = ref([])
  const currentContent = ref(null)
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const totalItems = computed(() => pagination.value.total)
  const totalPages = computed(() => pagination.value.totalPages)
  const currentPage = computed(() => pagination.value.page)

  /**
   * Fetch paginated content list with optional filters.
   */
  async function fetchContent(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/content', { params })
      contentList.value = response.data.content
      pagination.value = response.data.pagination
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single content item by ID.
   */
  async function fetchContentById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/content/${id}`)
      currentContent.value = response.data.content
      return response.data.content
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new content.
   */
  async function createContent(contentData) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/content', contentData)
      currentContent.value = response.data.content
      return response.data.content
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing content.
   */
  async function updateContent(id, contentData) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/content/${id}`, contentData)
      currentContent.value = response.data.content
      return response.data.content
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete (soft delete) content.
   */
  async function deleteContent(id) {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/content/${id}`)
      contentList.value = contentList.value.filter((c) => c.id !== id)
      pagination.value.total--
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // Workflow Actions
  // ============================================================

  async function submitContent(id, comment = null) {
    const response = await apiClient.post(`/content/${id}/submit`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function approveContent(id, comment = null) {
    const response = await apiClient.post(`/content/${id}/approve`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function rejectContent(id, comment) {
    const response = await apiClient.post(`/content/${id}/reject`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function publishContent(id, comment = null) {
    const response = await apiClient.post(`/content/${id}/publish`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function scheduleContent(id, scheduledAt) {
    const response = await apiClient.post(`/content/${id}/schedule`, { scheduled_at: scheduledAt })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function unscheduleContent(id, comment = null) {
    const response = await apiClient.post(`/content/${id}/unschedule`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  async function archiveContent(id, comment = null) {
    const response = await apiClient.post(`/content/${id}/archive`, { comment })
    currentContent.value = response.data.content
    _updateInList(response.data.content)
    return response.data.content
  }

  // ============================================================
  // Versions
  // ============================================================

  async function fetchVersions(id) {
    const response = await apiClient.get(`/content/${id}/versions`)
    return response.data.versions
  }

  async function restoreVersion(id, versionId) {
    const response = await apiClient.post(`/content/${id}/restore/${versionId}`)
    currentContent.value = response.data.content
    return response.data
  }

  // ============================================================
  // Bulk Actions
  // ============================================================

  /**
   * Bulk hide published content by setting manually_hidden = true.
   * @param {number[]} ids - Array of content IDs to hide.
   */
  async function bulkHideContent(ids) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/content/bulk/hide', { ids })
      // Update local list in-place
      ids.forEach((id) => {
        const item = contentList.value.find((c) => c.id === id)
        if (item) item.manually_hidden = true
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to hide content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Bulk show hidden content by setting manually_hidden = false.
   * @param {number[]} ids - Array of content IDs to show.
   */
  async function bulkShowContent(ids) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/content/bulk/show', { ids })
      // Update local list in-place
      ids.forEach((id) => {
        const item = contentList.value.find((c) => c.id === id)
        if (item) item.manually_hidden = false
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to show content.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // AI Summarisation
  // ============================================================

  async function summarizeContent(id, locale = 'en') {
    const response = await apiClient.post(`/content/${id}/summarize`, { locale })
    return response.data
  }

  // ============================================================
  // Helpers
  // ============================================================

  function _updateInList(updatedContent) {
    const index = contentList.value.findIndex((c) => c.id === updatedContent.id)
    if (index !== -1) {
      contentList.value[index] = updatedContent
    }
  }

  function resetCurrentContent() {
    currentContent.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    contentList,
    currentContent,
    pagination,
    loading,
    error,
    // Getters
    totalItems,
    totalPages,
    currentPage,
    // CRUD
    fetchContent,
    fetchContentById,
    createContent,
    updateContent,
    deleteContent,
    // Workflow
    submitContent,
    approveContent,
    rejectContent,
    publishContent,
    scheduleContent,
    unscheduleContent,
    archiveContent,
    // Versions
    fetchVersions,
    restoreVersion,
    // AI
    summarizeContent,
    // Bulk Actions
    bulkHideContent,
    bulkShowContent,
    // Helpers
    resetCurrentContent,
    clearError,
  }
})
