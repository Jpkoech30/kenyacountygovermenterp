import apiClient from './axios'

/**
 * AI Content Assistant API Client
 *
 * Provides functions to generate structured content drafts from:
 * - A URL (scrape + AI generate)
 * - An uploaded file (extract + AI generate)
 *
 * All paths are relative to the axios baseURL (/api).
 * The backend routes are mounted at /api/ai/content-assistant/*
 */

/**
 * Generate a content draft from a URL.
 * @param {string} url - The URL to scrape
 * @returns {Promise<{ draft: object, usage: object }>}
 */
export async function generateFromUrl(url) {
  const response = await apiClient.post('/ai/content-assistant/from-url', { url })
  return response.data
}

/**
 * Generate a content draft from an uploaded file.
 * @param {number} mediaId - The ID of the uploaded media file
 * @returns {Promise<{ draft: object, usage: object }>}
 */
export async function generateFromFile(mediaId) {
  const response = await apiClient.post('/ai/content-assistant/from-file', {
    media_id: mediaId,
  })
  return response.data
}

/**
 * Upload a file directly from the user's computer and generate a content draft.
 * Uses multipart/form-data to send the file to the backend.
 * @param {File} file - The File object from an <input type="file">
 * @returns {Promise<{ draft: object, usage: object, media: object }>}
 */
export async function generateFromFileUpload(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/ai/content-assistant/from-file-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
