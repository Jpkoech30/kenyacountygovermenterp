<script setup>
/**
 * TagSuggestion.vue - Clickable tag chip selector for AI-suggested tags.
 * Displays suggested tags as DaisyUI badges; user can click to toggle selection.
 */
import { ref, computed } from 'vue'

const props = defineProps({
  /** Array of suggested tag strings from the AI API */
  tags: { type: Array, default: () => [] },
  /** Array of currently selected tag strings */
  modelValue: { type: Array, default: () => [] },
  /** Maximum number of tags that can be selected */
  maxSelect: { type: Number, default: 10 },
})

const emit = defineEmits(['update:modelValue'])

const selectedTags = ref([...props.modelValue])

const canSelectMore = computed(() => selectedTags.value.length < props.maxSelect)

function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else if (canSelectMore.value) {
    selectedTags.value.push(tag)
  }
  emit('update:modelValue', [...selectedTags.value])
}

function selectAll() {
  const available = props.tags.filter((t) => !selectedTags.value.includes(t))
  const toAdd = available.slice(0, props.maxSelect - selectedTags.value.length)
  selectedTags.value.push(...toAdd)
  emit('update:modelValue', [...selectedTags.value])
}

function clearAll() {
  selectedTags.value = []
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="space-y-3">
    <!-- Suggested tags -->
    <div v-if="tags.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-base-content/60">
          Suggested Tags ({{ tags.length }})
        </h4>
        <div class="flex gap-2">
          <button
            class="btn btn-ghost btn-xs"
            :disabled="selectedTags.length >= maxSelect"
            @click="selectAll"
          >
            Select All
          </button>
          <button
            class="btn btn-ghost btn-xs"
            :disabled="selectedTags.length === 0"
            @click="clearAll"
          >
            Clear
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag"
          class="badge badge-lg cursor-pointer transition-all"
          :class="{
            'badge-primary badge-outline': !selectedTags.includes(tag),
            'badge-primary': selectedTags.includes(tag),
          }"
          @click="toggleTag(tag)"
          :title="selectedTags.includes(tag) ? 'Click to remove' : 'Click to add'"
        >
          {{ selectedTags.includes(tag) ? '✓ ' : '' }}{{ tag }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-4 text-base-content/40 text-sm">
      <p>No tag suggestions available. Use the AI Suggest Tags action to generate tags.</p>
    </div>

    <!-- Selected count -->
    <div class="text-xs text-base-content/40 flex items-center gap-2">
      <span>{{ selectedTags.length }} / {{ maxSelect }} selected</span>
      <span v-if="!canSelectMore" class="text-warning">(max reached)</span>
    </div>
  </div>
</template>
