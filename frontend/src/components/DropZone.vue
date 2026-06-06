<script setup>
/**
 * DropZone.vue — drag-and-drop file upload area with preview.
 * Emits 'files-selected' with an array of File objects.
 *
 * Usage:
 *   <DropZone accept="image/*,.pdf" :max-size="10" @files-selected="handleFiles" />
 *
 * Props:
 *   accept    — accepted MIME types / extensions (default: image/*)
 *   max-size  — max file size in MB (default: 10)
 *   multiple  — allow multiple files (default: true)
 */
import { ref, computed } from 'vue'
import { Upload, FileText, X, AlertCircle } from '@lucide/vue'

const props = defineProps({
  accept: { type: String, default: 'image/*,.pdf,.doc,.docx' },
  maxSize: { type: Number, default: 10 },
  multiple: { type: Boolean, default: true },
})

const emit = defineEmits(['files-selected'])

const dragOver = ref(false)
const previews = ref([])
const error = ref('')

const maxBytes = computed(() => props.maxSize * 1024 * 1024)

function onDragOver(e) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onDrop(e) {
  e.preventDefault()
  dragOver.value = false
  handleFiles(e.dataTransfer.files)
}

function onInputChange(e) {
  handleFiles(e.target.files)
}

function handleFiles(fileList) {
  error.value = ''
  const validFiles = []

  for (const file of fileList) {
    if (file.size > maxBytes.value) {
      error.value = `"${file.name}" exceeds the ${props.maxSize} MB limit.`
      continue
    }
    validFiles.push(file)
  }

  if (validFiles.length === 0) return

  // Generate previews for images
  previews.value = validFiles.map((file) => ({
    file,
    url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    name: file.name,
    size: (file.size / 1024).toFixed(1),
  }))

  emit('files-selected', validFiles)
}

function removePreview(index) {
  const removed = previews.value.splice(index, 1)[0]
  if (removed.url) URL.revokeObjectURL(removed.url)
  if (previews.value.length === 0) {
    emit('files-selected', [])
  } else {
    emit('files-selected', previews.value.map((p) => p.file))
  }
}

function formatSize(kb) {
  if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}
</script>

<template>
  <div>
    <!-- Drop zone -->
    <div
      class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
      :class="{
        'border-primary bg-primary/5': dragOver,
        'border-base-300 hover:border-base-content/30 bg-base-100': !dragOver,
      }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="$refs.fileInput?.click()"
      role="button"
      tabindex="0"
      @keydown.enter="$refs.fileInput?.click()"
      @keydown.space.prevent="$refs.fileInput?.click()"
      :aria-label="'Upload files. Drag and drop or click to browse.'"
    >
      <Upload class="w-10 h-10 mx-auto mb-3 text-base-content/30" />
      <p class="text-sm font-medium text-base-content/70">
        Drag & drop files here, or <span class="text-primary underline">browse</span>
      </p>
      <p class="text-xs text-base-content/40 mt-1">
        Accepted: {{ accept }} &middot; Max: {{ maxSize }} MB
      </p>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="onInputChange"
      />
    </div>

    <!-- Error message -->
    <div v-if="error" class="flex items-center gap-2 mt-3 text-sm text-error">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Preview list -->
    <div v-if="previews.length" class="mt-4 space-y-2">
      <div
        v-for="(item, index) in previews"
        :key="item.name"
        class="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200"
      >
        <!-- Image thumbnail -->
        <img
          v-if="item.url"
          :src="item.url"
          :alt="item.name"
          class="w-10 h-10 rounded object-cover shrink-0"
        />
        <!-- File icon fallback -->
        <div v-else class="w-10 h-10 rounded bg-base-200 flex items-center justify-center shrink-0">
          <FileText class="w-5 h-5 text-base-content/40" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ item.name }}</p>
          <p class="text-xs text-base-content/40">{{ formatSize(item.size) }}</p>
        </div>
        <button
          class="btn btn-ghost btn-xs btn-square"
          @click.stop="removePreview(index)"
          aria-label="Remove file"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
