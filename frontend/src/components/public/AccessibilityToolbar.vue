<script setup>
/**
 * Accessibility toolbar — font size, high contrast, skip-to-content.
 */
import { ref, watch } from 'vue'
import { Accessibility, ZoomIn, ZoomOut, Sun, X } from '@lucide/vue'

const emit = defineEmits(['close'])

const fontSize = ref(parseInt(localStorage.getItem('wp_font_size') || '100'))
const highContrast = ref(localStorage.getItem('wp_high_contrast') === 'true')

watch(fontSize, (val) => {
  document.documentElement.style.fontSize = val + '%'
  localStorage.setItem('wp_font_size', String(val))
})

watch(highContrast, (val) => {
  document.documentElement.classList.toggle('high-contrast', val)
  localStorage.setItem('wp_high_contrast', val ? 'true' : 'false')
})

function increaseFont() {
  if (fontSize.value < 150) fontSize.value += 10
}

function decreaseFont() {
  if (fontSize.value > 70) fontSize.value -= 10
}

function resetFont() {
  fontSize.value = 100
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[100]">
    <div class="card bg-base-100 shadow-xl border border-base-300 w-64">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm flex items-center gap-2">
            <Accessibility class="w-4 h-4" />
            Accessibility
          </h3>
          <button class="btn btn-ghost btn-xs btn-square" @click="$emit('close')">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Font Size -->
        <div class="mb-3">
          <p class="text-xs font-medium mb-1">Font Size</p>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-xs" @click="decreaseFont" title="Decrease font size">
              <ZoomOut class="w-3 h-3" />
            </button>
            <button class="btn btn-outline btn-xs" @click="resetFont" title="Reset font size">
              {{ fontSize }}%
            </button>
            <button class="btn btn-outline btn-xs" @click="increaseFont" title="Increase font size">
              <ZoomIn class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- High Contrast -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">High Contrast</span>
          <input type="checkbox" class="toggle toggle-sm" v-model="highContrast" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* High contrast mode */
html.high-contrast {
  filter: contrast(1.3) brightness(1.05);
}
html.high-contrast img {
  filter: contrast(1.1);
}
</style>
