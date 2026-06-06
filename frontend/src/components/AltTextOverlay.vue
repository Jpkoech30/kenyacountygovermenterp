<script setup>
/**
 * AltTextOverlay.vue - Overlay that appears after inserting an image into the editor,
 * prompting the user to provide alt text for accessibility.
 */
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  imageSrc: {
    type: String,
    default: '',
  },
  currentAlt: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['save', 'close'])

const altText = ref('')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      altText.value = props.currentAlt || ''
    }
  }
)

function handleSave() {
  emit('save', altText.value)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="visible"
    class="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-box"
    @click.self="handleClose"
  >
    <div class="bg-base-100 p-4 rounded-box shadow-lg max-w-sm w-full mx-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-sm">Image Alt Text</h4>
        <button class="btn btn-ghost btn-xs btn-square" @click="handleClose" aria-label="Close">✕</button>
      </div>

      <!-- Preview thumbnail -->
      <img
        :src="imageSrc"
        alt="Preview"
        class="w-full h-32 object-cover rounded-box mb-3 bg-base-200"
      />

      <label class="label">
        <span class="label-text text-xs">Describe this image for accessibility</span>
      </label>
      <input
        v-model="altText"
        type="text"
        class="input input-bordered input-sm w-full"
        placeholder="e.g. Governor John Smith at the launch event"
        @keyup.enter="handleSave"
        @keyup.escape="handleClose"
      />

      <div class="flex gap-2 mt-3 justify-end">
        <button class="btn btn-ghost btn-xs" @click="handleClose">Skip</button>
        <button class="btn btn-primary btn-xs" @click="handleSave">Save Alt Text</button>
      </div>
    </div>
  </div>
</template>
