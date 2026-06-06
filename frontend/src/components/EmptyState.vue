<script setup>
/**
 * EmptyState.vue — consistent empty-state placeholder for lists and tables.
 * Supports an optional icon (Lucide component), title, description, and action slot.
 *
 * Usage:
 *   <EmptyState icon="Inbox" title="No messages" description="You have no unread messages.">
 *     <router-link to="/compose" class="btn btn-primary btn-sm">Compose</router-link>
 *   </EmptyState>
 */
import { computed } from 'vue'
import { Inbox, FileText, Search, Users, Image, AlertCircle } from '@lucide/vue'

const props = defineProps({
  icon: { type: String, default: 'Inbox' },
  title: { type: String, default: 'No data found' },
  description: { type: String, default: '' },
})

const iconMap = { Inbox, FileText, Search, Users, Image, AlertCircle }
const resolvedIcon = computed(() => iconMap[props.icon] || Inbox)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
      <component :is="resolvedIcon" class="w-8 h-8 text-base-content/40" />
    </div>
    <h3 class="text-lg font-semibold text-base-content/70">{{ title }}</h3>
    <p v-if="description" class="text-sm text-base-content/40 mt-1 max-w-sm">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
