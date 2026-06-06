import apiClient from './axios'

/**
 * Create new content.
 * @param {Object} contentData
 * @returns {Promise<Object>}
 */
export async function createContent(contentData) {
  const response = await apiClient.post('/content', contentData)
  return response.data.content
}

/**
 * Fetch content by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function fetchContentById(id) {
  const response = await apiClient.get(`/content/${id}`)
  return response.data.content
}

/**
 * Update existing content.
 * @param {number|string} id
 * @param {Object} contentData
 * @returns {Promise<Object>}
 */
export async function updateContent(id, contentData) {
  const response = await apiClient.put(`/content/${id}`, contentData)
  return response.data.content
}

/**
 * Delete content.
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteContent(id) {
  await apiClient.delete(`/content/${id}`)
}
