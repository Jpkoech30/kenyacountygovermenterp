<script setup>
/**
 * NotificationDropdown.vue — Facebook-style bell icon with notification panel.
 * Features:
 * - Bell icon with unread count badge
 * - White dropdown panel with notification list
 * - Each notification has icon, message, timestamp
 * - "Mark all as read" link at bottom
 * - Keyboard: Escape to close, click outside to close
 * - Focus management: auto-focuses first item on open
 *
 * @requires useNotificationStore
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Bell } from '@lucide/vue'
import { useNotificationStore } from '../stores/notifications'

const store = useNotificationStore()
const isOpen = ref(false)
const dropdownRef = ref(null)
const firstItemRef = ref(null)

/** Icon mapping by notification type */
const typeIcon = computed(() => ({
  submit: '📝',
  approve: '✅',
  publish: '🚀',
  review: '👁️',
  system: '🔔',
}))

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    store.fetchNotifications()
    // Focus first item on next tick
    nextTick(() => {
      firstItemRef.value?.focus()
    })
  }
}

function closeDropdown() {
  isOpen.value = false
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeDropdown()
  }
}

/** Click outside handler */
function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  store.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Bell button with unread badge -->
    <button
      class="nav-icon-btn btn btn-square btn-ghost text-base-content w-10 h-10 p-1.5 relative"
      @click.stop="toggleDropdown"
      @keydown.escape="closeDropdown"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      aria-controls="notification-panel"
      :aria-label="`Notifications${store.hasUnread ? ` (${store.unreadCount} unread)` : ''}`"
    >
      <Bell class="w-4.5 h-4.5" aria-hidden="true" />
      <span
        v-if="store.hasUnread"
        class="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-primary"
        aria-hidden="true"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <div
      id="notification-panel"
      v-show="isOpen"
      class="absolute right-0 top-full mt-2 z-[1] bg-white rounded-lg shadow-lg border border-gray-200 w-80 sm:w-96 overflow-hidden"
      role="menu"
      :aria-hidden="!isOpen"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-800">Notifications</h3>
        <button
          v-if="store.hasUnread"
          class="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          @click="store.markAllAsRead()"
        >
          Mark all as read
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="store.loading" class="flex justify-center py-6">
        <span class="loading loading-spinner loading-sm text-primary"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="store.notifications.length === 0" class="text-center py-8 text-gray-400 text-sm">
        <Bell class="w-8 h-8 mx-auto mb-2 text-gray-300" aria-hidden="true" />
        <p>No notifications yet</p>
      </div>

      <!-- Notification list -->
      <div v-else class="max-h-80 overflow-y-auto">
        <button
          v-for="(item, idx) in store.notifications"
          :key="item.id"
          :ref="idx === 0 ? firstItemRef : null"
          class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0"
          :class="{ 'bg-blue-50/50': !item.read }"
          role="menuitem"
          :aria-current="!item.read ? 'true' : undefined"
          @click="store.markAsRead(item.id)"
        >
          <span class="text-base mt-0.5 shrink-0" aria-hidden="true">{{ typeIcon[item.type] || '🔔' }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 line-clamp-2" :class="{ 'font-semibold': !item.read }">
              {{ item.message }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">{{ store.relativeTime(item.timestamp) }}</p>
          </div>
          <span v-if="!item.read" class="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </div>
</template>
