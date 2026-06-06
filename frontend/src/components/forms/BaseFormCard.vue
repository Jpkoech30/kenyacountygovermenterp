<script setup>
/**
 * BaseFormCard.vue – Consistent card wrapper for form sections.
 * Provides a DaisyUI card with optional title, description, and icon.
 * Used across all admin form pages for visual consistency.
 */
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  padding: { type: String, default: 'p-4' },
})
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div :class="padding">
      <!-- Header with optional icon + title + description -->
      <div v-if="title || description" class="mb-3">
        <div v-if="title" class="flex items-center gap-2">
          <component :is="icon" v-if="icon" class="w-4 h-4 text-base-content/60 shrink-0" />
          <h3 class="font-semibold text-sm">{{ title }}</h3>
        </div>
        <p v-if="description" class="text-xs text-base-content/50 mt-0.5">
          {{ description }}
        </p>
      </div>

      <!-- Slot for form fields -->
      <slot />
    </div>
  </div>
</template>
