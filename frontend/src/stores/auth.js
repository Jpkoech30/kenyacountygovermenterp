import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/axios'

/**
 * Authentication Store
 * Manages user authentication state, token storage, and login/logout.
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role?.name === 'admin')
  const userName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`
  })
  const userRole = computed(() => user.value?.role?.name || '')

  /**
   * Login with email and password.
   * Stores token and user data in localStorage.
   */
  async function login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data

      // Store in state
      token.value = newToken
      user.value = userData

      // Persist to localStorage
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      return { success: false, message }
    }
  }

  /**
   * Logout - clear all auth state.
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * Fetch current user profile from API and update store.
   */
  async function fetchMe() {
    try {
      const response = await apiClient.get('/auth/me')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    userName,
    userRole,
    login,
    logout,
    fetchMe,
  }
})
