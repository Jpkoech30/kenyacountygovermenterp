<script setup>
/**
 * ContentFeed.vue — Facebook-style content feed with infinite scroll.
 * Features:
 * - Renders a list of ContentCard items
 * - Infinite scroll via IntersectionObserver (loads more when sentinel is visible)
 * - Loading state with SkeletonLoader
 * - Empty state when no items
 * - Error state with retry button
 *
 * Props:
 *   items: Array — content items to display
 *   loading: Boolean — whether items are loading
 *   hasMore: Boolean — whether more items are available
 *   error: String | null — error message if fetch failed
 *
 * @emits loadMore — emitted when sentinel enters viewport
 * @emits retry — emitted when retry button is clicked
 */
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import ContentCard from './ContentCard.vue'
import SkeletonLoader from './SkeletonLoader.vue'
import { RefreshCw } from '@lucide/vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: true },
  error: { type: String, default: null },
})

const emit = defineEmits(['loadMore', 'retry'])

const sentinelRef = ref(null)
let observer = null

function setupObserver() {
  if (observer) observer.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loading) {
        emit('loadMore')
      }
    },
    { rootMargin: '200px' }
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
}

onMounted(() => {
  nextTick(setupObserver)
})

watch(
  () => props.items.length,
  () => {
    nextTick(setupObserver)
  }
)

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function handleLike(id) {
  console.log('Like:', id)
}

function handleComment(id) {
  console.log('Comment:', id)
}

function handleShare(id) {
  console.log('Share:', id)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Error state -->
    <div v-if="error" class="facebook-card p-6 text-center">
      <p class="text-sm text-red-500 mb-3">{{ error }}</p>
      <button
        class="btn btn-sm btn-primary"
        @click="$emit('retry')"
      >
        <RefreshCw class="w-4 h-4 mr-1" aria-hidden="true" />
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && items.length === 0" class="facebook-card p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <p class="text-sm text-gray-500 font-medium">No content yet</p>
      <p class="text-xs text-gray-400 mt-1">Content will appear here once published.</p>
    </div>

    <!-- Content list -->
    <template v-else>
      <ContentCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        @like="handleLike"
        @comment="handleComment"
        @share="handleShare"
      />

      <!-- Loading skeletons -->
      <SkeletonLoader v-if="loading" type="card" :count="2" />

      <!-- Infinite scroll sentinel -->
      <div
        v-if="hasMore"
        ref="sentinelRef"
        class="h-4"
        aria-hidden="true"
      ></div>

      <!-- End of feed -->
      <div v-if="!hasMore && items.length > 0" class="text-center py-4">
        <p class="text-xs text-gray-400">You're all caught up</p>
      </div>
    </template>
  </div>
</template>
