<script setup>
/**
 * MobileBottomNav.vue — Facebook-style bottom navigation bar for mobile.
 * Shows 5 primary navigation items with active state indicator.
 * Only visible on small screens (lg:hidden).
 *
 * Features:
 * - 5 icon+label nav items
 * - Active state with blue indicator
 * - Haptic-friendly touch targets (min 44px)
 * - Safe area padding for modern phones
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard,
  Globe,
  Bell,
  Settings,
  Menu,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.isAdmin)

const navItems = computed(() => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { key: 'content', label: 'Content', icon: Globe, to: '/website/news' },
    { key: 'notifications', label: 'Alerts', icon: Bell, to: '#' },
  ]

  if (isAdmin.value) {
    items.push({ key: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings' })
  }

  items.push({ key: 'more', label: 'More', icon: Menu, to: '#' })

  return items
})

function isActive(item) {
  if (item.to === '#') return false
  return route.path.startsWith(item.to)
}

function handleNav(item) {
  if (item.to && item.to !== '#') {
    router.push(item.to)
  }
}
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
    aria-label="Mobile navigation"
  >
    <div class="flex items-center justify-around h-14">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 relative transition-colors duration-150"
        :class="isActive(item) ? 'text-primary' : 'text-gray-400 hover:text-gray-600'"
        @click="handleNav(item)"
        :aria-label="item.label"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <!-- Active indicator bar -->
        <span
          v-if="isActive(item)"
          class="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-b"
          aria-hidden="true"
        ></span>
        <component :is="item.icon" class="w-5 h-5" aria-hidden="true" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* Safe area padding for notched phones */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
