/**
 * Notifications Store — Pinia store for notification state.
 * Manages a list of notifications with read/unread status.
 * Provides actions to fetch, mark as read, and clear notifications.
 *
 * @usage
 *   import { useNotificationStore } from '../stores/notifications'
 *   const store = useNotificationStore()
 *   store.fetchNotifications()
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  /** @type {import('vue').Ref<Array<{id: number, type: string, message: string, timestamp: string, read: boolean}>>} */
  const notifications = ref([])

  /** Whether notifications are currently loading */
  const loading = ref(false)

  /** Count of unread notifications */
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  /** Whether there are any unread notifications */
  const hasUnread = computed(() => unreadCount.value > 0)

  /**
   * Fetch notifications from the API.
   * Falls back to mock data if the endpoint doesn't exist yet.
   */
  async function fetchNotifications() {
    loading.value = true
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        notifications.value = await res.json()
      } else {
        throw new Error('API not available')
      }
    } catch {
      // Mock data for development
      notifications.value = [
        { id: 1, type: 'submit', message: 'Content #42 "Budget Report" submitted for review', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
        { id: 2, type: 'approve', message: 'Leave request for John Doe approved', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
        { id: 3, type: 'publish', message: 'News article "County Development Update" published', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), read: false },
        { id: 4, type: 'review', message: 'Content #38 "Q3 Report" needs your review', timestamp: new Date(Date.now() - 240 * 60000).toISOString(), read: true },
        { id: 5, type: 'system', message: 'System backup completed successfully', timestamp: new Date(Date.now() - 480 * 60000).toISOString(), read: true },
      ]
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a single notification as read.
   * @param {number} id
   */
  function markAsRead(id) {
    const item = notifications.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  /** Mark all notifications as read. */
  function markAllAsRead() {
    notifications.value.forEach((n) => { n.read = true })
  }

  /**
   * Get a relative time string from an ISO timestamp.
   * @param {string} isoString
   * @returns {string}
   */
  function relativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(isoString).toLocaleDateString()
  }

  return {
    notifications,
    loading,
    unreadCount,
    hasUnread,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    relativeTime,
  }
})
