<script setup>
/**
 * EditorPreviewModal.vue - Preview modal for live editor content.
 * Shows rendered HTML with mobile/tablet/desktop viewport toggles.
 * Separate from PreviewModal.vue which reads from contentStore (server data).
 */
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  bodyHtml: {
    type: String,
    default: '',
  },
  locale: {
    type: String,
    default: 'en',
  },
})

const emit = defineEmits(['close'])

const viewportMode = ref('desktop')

const localeLabels = {
  en: 'English',
  sw: 'Kiswahili',
  pok: 'Pokot',
}

const viewportOptions = [
  { key: 'mobile', label: '📱', width: '375px' },
  { key: 'tablet', label: '📟', width: '768px' },
  { key: 'desktop', label: '🖥️', width: '100%' },
]

const viewportWidth = ref('100%')

function setViewport(mode) {
  viewportMode.value = mode
  const option = viewportOptions.find((o) => o.key === mode)
  viewportWidth.value = option ? option.width : '100%'
}

function close() {
  emit('close')
}
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 bg-black/50 overflow-y-auto"
    @click.self="close"
  >
    <div class="modal-box max-w-5xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold">Preview</h3>
          <span class="badge badge-ghost badge-sm">{{ localeLabels[locale] || locale }}</span>
        </div>

        <!-- Viewport toggles -->
        <div class="flex gap-1" role="group" aria-label="Viewport size">
          <button
            v-for="opt in viewportOptions"
            :key="opt.key"
            class="btn btn-xs"
            :class="viewportMode === opt.key ? 'btn-primary' : 'btn-ghost'"
            :aria-label="opt.key"
            :title="opt.key"
            @click="setViewport(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>

        <button class="btn btn-sm btn-circle btn-ghost" @click="close" aria-label="Close preview">✕</button>
      </div>

      <!-- Preview frame -->
      <div
        class="border border-base-300 rounded-box overflow-auto bg-white mx-auto transition-all duration-200"
        :style="{ maxWidth: viewportWidth }"
      >
        <div class="prose prose-sm max-w-none p-6">
          <!-- Title -->
          <h1 v-if="title" class="text-2xl font-bold mb-4">{{ title }}</h1>

          <!-- Body HTML -->
          <div v-if="bodyHtml" v-html="bodyHtml"></div>
          <p v-else class="text-base-content/50 italic">No content to preview.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button class="btn btn-ghost" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>
