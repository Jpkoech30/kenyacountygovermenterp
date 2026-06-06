<script setup>
/**
 * RightSidebar.vue — Facebook-style right sidebar panel.
 * Features:
 * - Trending topics / popular content
 * - Quick stats cards (content count, pending reviews, etc.)
 * - Recent activity feed
 * - Collapsible sections
 *
 * Props:
 *   stats: Object — { totalContent, pendingReview, publishedToday, draftCount }
 *   trending: Array — [{ label, count, to }]
 *   recentActivity: Array — [{ id, type, message, timestamp }]
 */
import { ref } from 'vue'
import { TrendingUp, BarChart3, Activity, ChevronRight } from '@lucide/vue'

defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalContent: 0,
      pendingReview: 0,
      publishedToday: 0,
      draftCount: 0,
    }),
  },
  trending: {
    type: Array,
    default: () => [],
  },
  recentActivity: {
    type: Array,
    default: () => [],
  },
})

const trendingOpen = ref(true)
const activityOpen = ref(true)

function toggleSection(section) {
  if (section === 'trending') trendingOpen.value = !trendingOpen.value
  if (section === 'activity') activityOpen.value = !activityOpen.value
}

/** Relative time helper */
function relativeTime(isoString) {
  if (!isoString) return ''
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
</script>

<template>
  <aside class="space-y-3">
    <!-- ── Quick Stats ── -->
    <div class="facebook-card p-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <BarChart3 class="w-3.5 h-3.5" aria-hidden="true" />
        Quick Stats
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-gray-50 rounded-lg p-2.5 text-center">
          <p class="text-lg font-bold text-gray-800">{{ stats.totalContent }}</p>
          <p class="text-[10px] text-gray-400">Total Content</p>
        </div>
        <div class="bg-amber-50 rounded-lg p-2.5 text-center">
          <p class="text-lg font-bold text-amber-600">{{ stats.pendingReview }}</p>
          <p class="text-[10px] text-amber-500">Pending Review</p>
        </div>
        <div class="bg-green-50 rounded-lg p-2.5 text-center">
          <p class="text-lg font-bold text-green-600">{{ stats.publishedToday }}</p>
          <p class="text-[10px] text-green-500">Published Today</p>
        </div>
        <div class="bg-blue-50 rounded-lg p-2.5 text-center">
          <p class="text-lg font-bold text-blue-600">{{ stats.draftCount }}</p>
          <p class="text-[10px] text-blue-500">Drafts</p>
        </div>
      </div>
    </div>

    <!-- ── Trending Topics ── -->
    <div class="facebook-card overflow-hidden">
      <button
        class="flex items-center justify-between w-full px-3 py-2.5 hover:bg-gray-50 transition-colors"
        @click="toggleSection('trending')"
        :aria-expanded="trendingOpen"
        aria-controls="sidebar-trending"
      >
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp class="w-3.5 h-3.5" aria-hidden="true" />
          Trending
        </h3>
        <ChevronRight
          class="w-3 h-3 text-gray-300 transition-transform duration-200"
          :class="{ 'rotate-90': trendingOpen }"
          aria-hidden="true"
        />
      </button>
      <div v-show="trendingOpen" id="sidebar-trending">
        <div v-if="trending.length === 0" class="px-3 pb-3">
          <p class="text-xs text-gray-400">No trending topics yet.</p>
        </div>
        <ul v-else class="px-2 pb-2 space-y-0.5">
          <li v-for="(topic, idx) in trending" :key="idx">
            <router-link
              :to="topic.to || '#'"
              class="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <span class="text-gray-700 truncate">{{ topic.label }}</span>
              <span class="text-xs text-gray-400 ml-2 shrink-0">{{ topic.count }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Recent Activity ── -->
    <div class="facebook-card overflow-hidden">
      <button
        class="flex items-center justify-between w-full px-3 py-2.5 hover:bg-gray-50 transition-colors"
        @click="toggleSection('activity')"
        :aria-expanded="activityOpen"
        aria-controls="sidebar-activity"
      >
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity class="w-3.5 h-3.5" aria-hidden="true" />
          Recent Activity
        </h3>
        <ChevronRight
          class="w-3 h-3 text-gray-300 transition-transform duration-200"
          :class="{ 'rotate-90': activityOpen }"
          aria-hidden="true"
        />
      </button>
      <div v-show="activityOpen" id="sidebar-activity">
        <div v-if="recentActivity.length === 0" class="px-3 pb-3">
          <p class="text-xs text-gray-400">No recent activity.</p>
        </div>
        <ul v-else class="px-2 pb-2 space-y-0.5">
          <li v-for="act in recentActivity" :key="act.id" class="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
            <span class="text-xs mt-0.5 shrink-0" aria-hidden="true">
              {{ act.type === 'publish' ? '🚀' : act.type === 'submit' ? '📝' : act.type === 'approve' ? '✅' : '🔔' }}
            </span>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 line-clamp-2">{{ act.message }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">{{ relativeTime(act.timestamp) }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
