import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/axios'

/**
 * User Management Store
 * Handles CRUD operations for admin user management.
 */
export const useUserStore = defineStore('users', () => {
  // State
  const users = ref([])
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const loading = ref(false)
  const error = ref(null)

  /**
   * Fetch paginated list of users with optional filters.
   */
  async function fetchUsers(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/users', { params })
      users.value = response.data.users
      pagination.value = response.data.pagination
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch users.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new user.
   */
  async function createUser(userData) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/users', userData)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create user.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing user.
   */
  async function updateUser(id, userData) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/users/${id}`, userData)
      // Update user in local list
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update user.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Soft delete (deactivate) a user.
   */
  async function deleteUser(id) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.delete(`/users/${id}`)
      // Remove from local list
      users.value = users.value.filter((u) => u.id !== id)
      pagination.value.total -= 1
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete user.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset guide progress for a user.
   */
  async function resetGuide(id) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post(`/users/${id}/reset-guide`)
      // Update user in local list
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index].guide_seen = {}
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reset guide.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetGuide,
  }
})
