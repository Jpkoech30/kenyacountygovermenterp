<script setup>
/**
 * MediaLibraryModal.vue - Modal dialog for selecting media files.
 * Used within the ContentEditor to insert images into content.
 * Shows a grid of uploaded media with select mode.
 */
import { ref, onMounted, watch } from 'vue'
import { useMediaStore } from '../stores/media'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  selectMode: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close', 'select'])

const mediaStore = useMediaStore()

// Local state
const selectedId = ref(null)
const searchQuery = ref('')
const filterType = ref('')

/**
 * Handle file upload via drag-and-drop or file picker.
 */
const fileInput = ref(null)
const uploading = ref(false)

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const files = event.target.files
  if (!files.length) return

  uploading.value = true
  try {
    await mediaStore.uploadMedia(Array.from(files))
  } catch (err) {
    console.error('Upload failed:', err)
  } finally {
    uploading.value = false
    event.target.value = '' // Reset input
  }
}

function handleDrop(event) {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length) {
    mediaStore.uploadMedia(Array.from(files))
  }
}

function handleDragOver(event) {
  event.preventDefault()
}

function selectMedia(media) {
  selectedId.value = media.id
  emit('select', media)
}

function close() {
  selectedId.value = null
  emit('close')
}

// Load media on open
watch(
  () => props.show,
  (val) => {
    if (val) {
      mediaStore.fetchMedia({ limit: 50 })
    }
  }
)

onMounted(() => {
  if (props.show) {
    mediaStore.fetchMedia({ limit: 50 })
  }
})

// Filter media by type
const filteredMedia = ref([])
watch(
  [() => mediaStore.mediaList, searchQuery, filterType],
  ([media, query, type]) => {
    let result = media
    if (query) {
      const q = query.toLowerCase()
      result = result.filter((m) => m.filename.toLowerCase().includes(q))
    }
    if (type) {
      result = result.filter((m) => m.mime_type.startsWith(type))
    }
    filteredMedia.value = result
  },
  { immediate: true }
)

function getMediaUrl(media) {
  return `/media/${media.disk_filename}`
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  return '📁'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="close"
  >
    <div class="modal-box max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">Media Library</h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="close">✕</button>
      </div>

      <!-- Toolbar: Search + Filter + Upload -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search media..."
          class="input input-bordered input-sm flex-1 min-w-[200px]"
        />
        <select v-model="filterType" class="select select-bordered select-sm">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="application/pdf">PDFs</option>
          <option value="application">Documents</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="triggerUpload" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          class="hidden"
          @change="handleFileUpload"
        />
      </div>

      <!-- Drop zone hint -->
      <div
        class="text-center text-sm text-base-content/50 mb-2"
        @drop="handleDrop"
        @dragover="handleDragOver"
      >
        Drag & drop files here or click Upload
      </div>

      <!-- Loading state -->
      <div v-if="mediaStore.loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Media Grid -->
      <div
        v-else-if="filteredMedia.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto flex-1"
      >
        <div
          v-for="media in filteredMedia"
          :key="media.id"
          class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
          :class="{ 'ring-2 ring-primary': selectedId === media.id }"
          @click="selectMedia(media)"
        >
          <!-- Thumbnail -->
          <figure class="h-24 overflow-hidden bg-base-300 flex items-center justify-center">
            <img
              v-if="media.mime_type.startsWith('image/')"
              :src="getMediaUrl(media)"
              :alt="media.filename"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl">{{ getFileIcon(media.mime_type) }}</span>
          </figure>

          <!-- Info -->
          <div class="p-2 text-xs">
            <p class="truncate font-medium" :title="media.filename">{{ media.filename }}</p>
            <p class="text-base-content/50">{{ formatFileSize(media.size) }}</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8 text-base-content/50">
        <p class="text-4xl mb-2">📁</p>
        <p>No media found. Upload some files to get started.</p>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button class="btn btn-ghost" @click="close">Cancel</button>
        <button
          v-if="selectMode && selectedId"
          class="btn btn-primary"
          @click="close"
        >
          Insert Selected
        </button>
      </div>
    </div>
  </div>
</template>
