<script setup>
/**
 * SkeletonLoader.vue — Facebook-style skeleton placeholder components.
 * Renders animated gray blocks that match the shape of the content being loaded.
 *
 * Props:
 *   type: 'card' | 'list' | 'table' | 'text' — shape variant
 *   count: number — how many skeleton items to render (default: 1)
 *   lines: number — for 'text' type, how many text lines (default: 3)
 *
 * @usage
 *   <SkeletonLoader type="card" :count="3" />
 *   <SkeletonLoader type="text" :lines="4" />
 */
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'card', validator: (v) => ['card', 'list', 'table', 'text'].includes(v) },
  count: { type: Number, default: 1 },
  lines: { type: Number, default: 3 },
})

const items = computed(() => Array.from({ length: props.count }, (_, i) => i))
</script>

<template>
  <div class="space-y-4">
    <!-- Card skeleton (Facebook-style) -->
    <template v-if="type === 'card'">
      <div v-for="i in items" :key="i" class="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
        <!-- Header: avatar + name + timestamp -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
          <div class="flex-1 space-y-1.5">
            <div class="h-3 bg-gray-200 rounded w-1/3"></div>
            <div class="h-2.5 bg-gray-100 rounded w-1/5"></div>
          </div>
        </div>
        <!-- Title -->
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <!-- Excerpt lines -->
        <div class="space-y-1.5">
          <div class="h-2.5 bg-gray-100 rounded w-full"></div>
          <div class="h-2.5 bg-gray-100 rounded w-5/6"></div>
        </div>
        <!-- Image placeholder -->
        <div class="h-40 bg-gray-100 rounded-lg w-full"></div>
        <!-- Actions bar -->
        <div class="flex gap-4 pt-1">
          <div class="h-3 bg-gray-200 rounded w-12"></div>
          <div class="h-3 bg-gray-200 rounded w-12"></div>
          <div class="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </template>

    <!-- List item skeleton -->
    <template v-else-if="type === 'list'">
      <div v-for="i in items" :key="i" class="flex items-center gap-3 p-3 animate-pulse">
        <div class="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
        <div class="flex-1 space-y-1.5">
          <div class="h-3 bg-gray-200 rounded w-2/3"></div>
          <div class="h-2.5 bg-gray-100 rounded w-1/3"></div>
        </div>
        <div class="h-3 bg-gray-100 rounded w-10"></div>
      </div>
    </template>

    <!-- Table row skeleton -->
    <template v-else-if="type === 'table'">
      <div v-for="i in items" :key="i" class="flex gap-4 p-3 border-b border-gray-100 animate-pulse">
        <div class="h-3 bg-gray-200 rounded flex-1"></div>
        <div class="h-3 bg-gray-200 rounded w-24"></div>
        <div class="h-3 bg-gray-200 rounded w-20"></div>
        <div class="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </template>

    <!-- Text block skeleton -->
    <template v-else>
      <div v-for="i in items" :key="i" class="space-y-2 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div v-for="j in lines" :key="j" class="h-2.5 bg-gray-100 rounded" :class="j === lines ? 'w-2/3' : 'w-full'"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
