import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchMenus as apiFetchMenus,
  createMenu as apiCreateMenu,
  updateMenu as apiUpdateMenu,
  deleteMenu as apiDeleteMenu,
  fetchMenuItems as apiFetchMenuItems,
  createMenuItem as apiCreateMenuItem,
  updateMenuItem as apiUpdateMenuItem,
  deleteMenuItem as apiDeleteMenuItem,
  reorderMenuItems as apiReorderMenuItems,
  fetchPublishedPages as apiFetchPublishedPages,
  fetchCategories as apiFetchCategories,
} from '@/api/menus'

export const useMenuStore = defineStore('menu', () => {
  // State
  const menus = ref([])
  const currentMenuItems = ref([])
  const publishedPages = ref([])
  const categories = ref([])
  const loading = ref(false)
  const itemsLoading = ref(false)
  const error = ref(null)

  // Getters
  const headerMenu = computed(() => menus.value.find((m) => m.location === 'header') || null)
  const footerMenu = computed(() => menus.value.find((m) => m.location === 'footer') || null)

  // Actions
  async function loadMenus() {
    loading.value = true
    error.value = null
    try {
      menus.value = await apiFetchMenus()
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createMenu(data) {
    const menu = await apiCreateMenu(data)
    menus.value.push(menu)
    return menu
  }

  async function updateMenu(id, data) {
    const updated = await apiUpdateMenu(id, data)
    const idx = menus.value.findIndex((m) => m.id === id)
    if (idx !== -1) menus.value[idx] = updated
    return updated
  }

  async function deleteMenu(id) {
    await apiDeleteMenu(id)
    menus.value = menus.value.filter((m) => m.id !== id)
  }

  async function loadMenuItems(menuId) {
    itemsLoading.value = true
    error.value = null
    try {
      currentMenuItems.value = await apiFetchMenuItems(menuId)
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      itemsLoading.value = false
    }
  }

  async function createMenuItem(menuId, data) {
    const item = await apiCreateMenuItem(menuId, data)
    currentMenuItems.value.push(item)
    return item
  }

  async function updateMenuItem(menuId, itemId, data) {
    const updated = await apiUpdateMenuItem(menuId, itemId, data)
    const idx = currentMenuItems.value.findIndex((i) => i.id === itemId)
    if (idx !== -1) currentMenuItems.value[idx] = updated
    return updated
  }

  async function deleteMenuItem(menuId, itemId) {
    await apiDeleteMenuItem(menuId, itemId)
    currentMenuItems.value = currentMenuItems.value.filter((i) => i.id !== itemId)
  }

  async function reorderItems(menuId, orderedIds) {
    await apiReorderMenuItems(menuId, orderedIds)
    // Reload items to get the new order from server
    await loadMenuItems(menuId)
  }

  async function loadPublishedPages() {
    try {
      publishedPages.value = await apiFetchPublishedPages()
    } catch (err) {
      console.error('Failed to load published pages:', err)
    }
  }

  async function loadCategories() {
    try {
      categories.value = await apiFetchCategories()
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  return {
    // State
    menus,
    currentMenuItems,
    publishedPages,
    categories,
    loading,
    itemsLoading,
    error,
    // Getters
    headerMenu,
    footerMenu,
    // Actions
    loadMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    loadMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderItems,
    loadPublishedPages,
    loadCategories,
  }
})
