/**
 * Persona API client — staff wizard and directory management.
 * All endpoints require admin authentication.
 */
import apiClient from './axios'

/**
 * Fetch persona templates and available roles.
 * @returns {Promise<{templates: Array, roles: Array}>}
 */
export async function fetchPersonaTemplates() {
  const { data } = await apiClient.get('/admin/persona/templates')
  return data
}

/**
 * Run the persona wizard — creates Person + optional Content + optional User.
 * @param {Object} payload - { template, person, user, create_content }
 * @returns {Promise<{person: Object}>}
 */
export async function runPersonaWizard(payload) {
  const { data } = await apiClient.post('/admin/persona/wizard', payload)
  return data
}

/**
 * List all staff with linked user accounts.
 * @param {Object} params - { department_id }
 * @returns {Promise<{staff: Array}>}
 */
export async function fetchStaffDirectory(params = {}) {
  const { data } = await apiClient.get('/admin/persona/staff', { params })
  return data
}
