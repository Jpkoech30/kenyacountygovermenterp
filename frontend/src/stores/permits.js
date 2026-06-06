/**
 * Permit Store - manages permit state for the Revenue & Business Licensing module.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/axios'

export const usePermitStore = defineStore('permits', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const permits = ref([])
  const currentPermit = ref(null)
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const loading = ref(false)
  const error = ref(null)

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const paidPermits = computed(() =>
    permits.value.filter((p) => p.status === 'paid')
  )

  const activePermits = computed(() =>
    permits.value.filter((p) => p.status === 'active')
  )

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch permits list with optional filters.
   * @param {Object} params - { status, page, limit, search }
   */
  async function fetchPermits(params = {}) {
    loading.value = true
    error.value = null
    try {
      const query = { ...params }
      const response = await apiClient.get('/permits', { params: query })
      permits.value = response.data.permits
      pagination.value = response.data.pagination
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch permits'
      console.error('❌ fetchPermits:', error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single permit by ID.
   * @param {number} id
   */
  async function fetchPermit(id) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/permits/${id}`)
      currentPermit.value = response.data.permit
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch permit'
      console.error('❌ fetchPermit:', error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit a new permit application (public).
   * @param {Object} data - Application form data
   * @returns {Promise<Object>} Created permit
   */
  async function applyForPermit(data) {
    error.value = null
    try {
      const response = await apiClient.post('/permits/apply', data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Application failed'
      console.error('❌ applyForPermit:', error.value)
      throw err
    }
  }

  /**
   * Initiate M-Pesa payment.
   * @param {number} permitId
   * @param {string} phone
   * @returns {Promise<Object>}
   */
  async function initiatePayment(permitId, phone) {
    error.value = null
    try {
      const response = await apiClient.post(`/permits/${permitId}/pay`, { phone })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Payment initiation failed'
      console.error('❌ initiatePayment:', error.value)
      throw err
    }
  }

  /**
   * Check permit status.
   * @param {number} permitId
   * @returns {Promise<Object>}
   */
  async function checkStatus(permitId) {
    try {
      const response = await apiClient.get(`/permits/${permitId}/status`)
      return response.data
    } catch (err) {
      console.error('❌ checkStatus:', err.response?.data?.error || err.message)
      throw err
    }
  }

  /**
   * Bulk assign permits to a clerk (revenue officer).
   * @param {number[]} permitIds
   * @param {number} clerkId
   * @returns {Promise<Object>}
   */
  async function assignPermits(permitIds, clerkId) {
    error.value = null
    try {
      const response = await apiClient.post('/permits/assign', {
        permit_ids: permitIds,
        clerk_id: clerkId,
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Assignment failed'
      console.error('❌ assignPermits:', error.value)
      throw err
    }
  }

  /**
   * Issue a permit (clerk).
   * @param {number} permitId
   * @returns {Promise<Object>}
   */
  async function issuePermit(permitId) {
    error.value = null
    try {
      const response = await apiClient.put(`/permits/${permitId}/issue`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Issuance failed'
      console.error('❌ issuePermit:', error.value)
      throw err
    }
  }

  /**
   * Renew a permit.
   * @param {number} permitId
   * @returns {Promise<Object>}
   */
  async function renewPermit(permitId) {
    error.value = null
    try {
      const response = await apiClient.post(`/permits/${permitId}/renew`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Renewal failed'
      console.error('❌ renewPermit:', error.value)
      throw err
    }
  }

  return {
    permits,
    currentPermit,
    pagination,
    loading,
    error,
    paidPermits,
    activePermits,
    fetchPermits,
    fetchPermit,
    applyForPermit,
    initiatePayment,
    checkStatus,
    assignPermits,
    issuePermit,
    renewPermit,
  }
})
