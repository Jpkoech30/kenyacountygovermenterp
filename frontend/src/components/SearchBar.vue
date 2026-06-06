<script setup>
/**
 * SearchBar.vue — Facebook-style navbar search input.
 * Features:
 * - Magnifying glass icon + placeholder text
 * - Debounced input (300ms) before emitting search
 * - Collapsible on mobile (icon-only, expands on click)
 * - Keyboard: Escape to close, Enter to submit
 *
 * @emits search {query: string} — emitted after debounce when user types
 * @emits submit {query: string} — emitted on Enter key
 */
import { ref, watch, onUnmounted } from 'vue'
import { Search, X } from '@lucide/vue'

const props = defineProps({
  /** Placeholder text for the input */
  placeholder: { type: String, default: 'Search content, people, menus...' },
  /** Whether search is expanded on mobile */
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['search', 'submit', 'update:modelValue'])

const query = ref('')
const inputRef = ref(null)
let debounceTimer = null

/** Debounced watch — emits search after 300ms of inactivity */
watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', { query: val })
  }, 300)
})

function handleSubmit() {
  emit('submit', { query: query.value })
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeSearch()
  }
  if (e.key === 'Enter') {
    handleSubmit()
  }
}

function clearSearch() {
  query.value = ''
  emit('search', { query: '' })
  inputRef.value?.focus()
}

function openSearch() {
  emit('update:modelValue', true)
  // Focus input on next tick after expansion
  setTimeout(() => inputRef.value?.focus(), 100)
}

function closeSearch() {
  emit('update:modelValue', false)
  query.value = ''
  emit('search', { query: '' })
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <!-- Desktop: always visible -->
  <div class="hidden md:flex relative flex-1 max-w-md mx-2">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" aria-hidden="true" />
    <input
      ref="inputRef"
      v-model="query"
      type="search"
      :placeholder="placeholder"
      class="w-full bg-base-200/70 text-base-content placeholder-base-content/40 rounded-full pl-9 pr-3 py-1.5 text-sm outline-none border border-transparent focus:bg-base-200 focus:border-base-300 transition-all duration-200"
      aria-label="Search"
      role="searchbox"
      @keydown="handleKeydown"
    />
    <button
      v-if="query"
      class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-base-300 transition-colors duration-150"
      @click="clearSearch"
      aria-label="Clear search"
    >
      <X class="w-3 h-3 text-base-content/60" aria-hidden="true" />
    </button>
  </div>

  <!-- Mobile: icon button that expands to full input -->
  <div class="flex md:hidden items-center">
    <template v-if="modelValue">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" aria-hidden="true" />
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          :placeholder="placeholder"
          class="w-full bg-base-200/70 text-base-content placeholder-base-content/40 rounded-full pl-9 pr-8 py-1.5 text-sm outline-none border border-transparent focus:bg-base-200 focus:border-base-300 transition-all duration-200"
          aria-label="Search"
          role="searchbox"
          @keydown="handleKeydown"
        />
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-base-300 transition-colors duration-150"
          @click="closeSearch"
          aria-label="Close search"
        >
          <X class="w-3 h-3 text-base-content/60" aria-hidden="true" />
        </button>
      </div>
    </template>
    <template v-else>
      <button
        class="nav-icon-btn btn btn-square btn-ghost text-base-content w-10 h-10 p-1.5"
        @click="openSearch"
        aria-label="Open search"
      >
        <Search class="w-4.5 h-4.5" aria-hidden="true" />
      </button>
    </template>
  </div>
</template>
