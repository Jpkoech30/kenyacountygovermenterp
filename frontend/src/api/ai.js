/**
 * ai.js - API client for AI Assist features.
 * All endpoints require authentication and AI access permissions.
 */
import apiClient from './axios'

/**
 * Check grammar and spelling in text.
 * @param {string} text - The text to check
 * @param {string} locale - Content locale (en, sw, pok)
 * @returns {Promise<{corrected: string, changes: Array<{original: string, corrected: string, type: string}>}>}
 */
export async function checkGrammar(text, locale = 'en') {
  const response = await apiClient.post('/ai/grammar', { text, locale })
  return response.data
}

/**
 * Translate text between locales.
 * @param {string} text - The text to translate
 * @param {string} sourceLocale - Source locale (en, sw, pok)
 * @param {string} targetLocale - Target locale (en, sw, pok)
 * @returns {Promise<{translatedText: string}>}
 */
export async function translateText(text, sourceLocale, targetLocale) {
  const response = await apiClient.post('/ai/translate', {
    text,
    source_locale: sourceLocale,
    target_locale: targetLocale,
  })
  return response.data
}

/**
 * Suggest tags for content based on title and body.
 * @param {string} title - Content title
 * @param {string} body - Content body
 * @param {number} maxTags - Maximum number of tags to suggest (default 5)
 * @returns {Promise<{tags: string[]}>}
 */
export async function suggestTags(title, body, maxTags = 5) {
  const response = await apiClient.post('/ai/suggest-tags', {
    title,
    body,
    max_tags: maxTags,
  })
  return response.data
}

/**
 * Suggest SEO metadata (meta description and keywords).
 * @param {string} title - Content title
 * @param {string} body - Content body
 * @param {string} locale - Content locale
 * @returns {Promise<{metaDescription: string, metaKeywords: string}>}
 */
export async function suggestSeo(title, body, locale = 'en') {
  const response = await apiClient.post('/ai/suggest-seo', {
    title,
    body,
    locale,
  })
  return response.data
}

/**
 * Generate alt text for an image.
 * @param {number} mediaId - The media ID
 * @param {string} imageUrl - URL of the image
 * @param {string} context - Optional context (e.g., page title)
 * @returns {Promise<{altText: string}>}
 */
export async function generateAltText(mediaId, imageUrl, context = '') {
  const response = await apiClient.post('/ai/generate-alt', {
    media_id: mediaId,
    image_url: imageUrl,
    context,
  })
  return response.data
}

/**
 * Improve or rewrite text based on an instruction.
 * @param {string} text - The text to improve
 * @param {string} instruction - Improvement instruction (e.g., "make it more professional")
 * @returns {Promise<{rewrittenText: string}>}
 */
export async function improveWriting(text, instruction) {
  const response = await apiClient.post('/ai/improve-writing', {
    text,
    instruction,
  })
  return response.data
}
