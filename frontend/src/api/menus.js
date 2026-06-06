/**
 * Menu API client — admin endpoints (requires authentication).
 */
import apiClient from './axios'

/**
 * Fetch all menus with item counts.
 */
export async function fetchMenus() {
  const { data } = await apiClient.get('/admin/menus')
  return data.menus
}

/**
 * Create a new menu.
 * @param {Object} payload - { name, location }
 */
export async function createMenu(payload) {
  const { data } = await apiClient.post('/admin/menus', payload)
  return data.menu
}

/**
 * Update a menu.
 * @param {number} id
 * @param {Object} payload - { name }
 */
export async function updateMenu(id, payload) {
  const { data } = await apiClient.put(`/admin/menus/${id}`, payload)
  return data.menu
}

/**
 * Delete a menu.
 * @param {number} id
 */
export async function deleteMenu(id) {
  const { data } = await apiClient.delete(`/admin/menus/${id}`)
  return data
}

/**
 * Fetch items for a specific menu (flat list).
 * @param {number} menuId
 */
export async function fetchMenuItems(menuId) {
  const { data } = await apiClient.get(`/admin/menus/${menuId}/items`)
  return data.items
}

/**
 * Create a menu item.
 * @param {number} menuId
 * @param {Object} payload
 */
export async function createMenuItem(menuId, payload) {
  const { data } = await apiClient.post(`/admin/menus/${menuId}/items`, payload)
  return data.item
}

/**
 * Update a menu item.
 * @param {number} menuId
 * @param {number} itemId
 * @param {Object} payload
 */
export async function updateMenuItem(menuId, itemId, payload) {
  const { data } = await apiClient.put(`/admin/menus/${menuId}/items/${itemId}`, payload)
  return data.item
}

/**
 * Delete a menu item.
 * @param {number} menuId
 * @param {number} itemId
 */
export async function deleteMenuItem(menuId, itemId) {
  const { data } = await apiClient.delete(`/admin/menus/${menuId}/items/${itemId}`)
  return data
}

/**
 * Reorder menu items.
 * @param {number} menuId
 * @param {Array} orderedIds - Array of item IDs in the new order
 */
export async function reorderMenuItems(menuId, orderedIds) {
  const { data } = await apiClient.put(`/admin/menus/${menuId}/reorder`, { orderedIds })
  return data
}

/**
 * Fetch published pages for linking in menu items.
 */
export async function fetchPublishedPages() {
  const { data } = await apiClient.get('/admin/menus/lookup/published-pages')
  return data.pages
}

/**
 * Fetch categories for linking in menu items.
 */
export async function fetchCategories() {
  const { data } = await apiClient.get('/admin/menus/lookup/categories')
  return data.categories
}
