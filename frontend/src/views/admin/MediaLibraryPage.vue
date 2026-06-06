<script setup>
/**
 * MediaLibraryPage.vue - Full media library page with grid view, upload, delete, and AI alt text generation.
 */
import { ref, onMounted, computed } from 'vue'
import { useMediaStore } from '../../stores/media'
import { useToast } from '../../composables/useToast'
import AIActionModal from '../../components/AIActionModal.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { generateAltText } from '../../api/ai'
import { Sparkles, Trash2, FileText, FolderOpen, ChevronLeft, ChevronRight, Search } from '@lucide/vue'

const mediaStore = useMediaStore()
const { addToast } = useToast()

// Filters
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)

// Upload
const fileInput = ref(null)
const uploading = ref(false)

// AI Alt Text state
const aiLoading = ref(false)
const aiError = ref(null)
const aiResult = ref(null)
const aiModalVisible = ref(false)
const aiTargetMedia = ref(null)

// Confirm dialog
const confirmDialog = ref(null)

// Load media
async function loadMedia() {
  try {
    const params = { page: currentPage.value, limit: 30 }
    if (searchQuery.value) params.search = searchQuery.value
    if (filterType.value) params.mime_type = filterType.value
    await mediaStore.fetchMedia(params)
  } catch (err) {
    addToast('Failed to load media.', 'error')
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const files = event.target.files
  if (!files.length) return

  uploading.value = true
  try {
    await mediaStore.uploadMedia(Array.from(files))
    addToast(`${files.length} file(s) uploaded.`, 'success')
  } catch (err) {
    addToast(err.response?.data?.message || 'Upload failed.', 'error')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

async function handleDelete(media) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Media',
    message: `Delete "${media.filename}"? This cannot be undone.`,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await mediaStore.deleteMedia(media.id)
    addToast('Media deleted.', 'success')
  } catch (err) {
    addToast('Failed to delete media.', 'error')
  }
}

// Generate alt text using AI
async function handleGenerateAltText(media) {
  if (!media.mime_type.startsWith('image/')) {
    addToast('Alt text generation is only available for images.', 'warning')
    return
  }

  aiLoading.value = true
  aiError.value = null
  aiResult.value = null
  aiTargetMedia.value = media
  aiModalVisible.value = true

  try {
    const imageUrl = `/media/${media.disk_filename}`
    const res = await generateAltText(media.id, imageUrl, media.filename)
    aiResult.value = res
  } catch (err) {
    aiError.value = err.response?.data?.message || err.message || 'Failed to generate alt text'
  } finally {
    aiLoading.value = false
  }
}

// Apply generated alt text
async function handleApplyAltText() {
  if (!aiTargetMedia.value || !aiResult.value?.altText) return

  try {
    // Update the media alt text via the API
    await mediaStore.updateMedia(aiTargetMedia.value.id, {
      alt_text: aiResult.value.altText,
    })
    // Update local state
    aiTargetMedia.value.alt_text = aiResult.value.altText
    addToast('Alt text applied successfully.', 'success')
    aiModalVisible.value = false
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save alt text.', 'error')
  }
}

function goToPage(page) {
  currentPage.value = page
  loadMedia()
}

function applyFilters() {
  currentPage.value = 1
  loadMedia()
}

function getMediaUrl(media) {
  return `/media/${media.disk_filename}`
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Computed pagination
const visiblePages = computed(() => {
  const total = mediaStore.totalPages
  const current = currentPage.value
  const maxVisible = 5
  if (total <= maxVisible) return total
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

onMounted(() => {
  loadMedia()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Media Library</h1>
        <p class="text-base-content/60">Upload and manage media files</p>
      </div>
      <button class="btn btn-primary" @click="triggerUpload" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Upload Files' }}
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

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search files..."
        class="input input-bordered input-sm flex-1 min-w-[200px]"
        @keyup.enter="applyFilters"
      />
      <select v-model="filterType" class="select select-bordered select-sm" @change="applyFilters">
        <option value="">All Types</option>
        <option value="image">Images</option>
        <option value="application/pdf">PDFs</option>
        <option value="application">Documents</option>
      </select>
      <button class="btn btn-sm btn-ghost gap-1" @click="applyFilters">
        <Search class="w-4 h-4" />
        Search
      </button>
    </div>

    <!-- Loading -->
    <div v-if="mediaStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Media Grid -->
    <div v-else-if="mediaStore.mediaList.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div
        v-for="media in mediaStore.mediaList"
        :key="media.id"
        class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Thumbnail -->
        <figure class="h-32 bg-base-200 flex items-center justify-center overflow-hidden">
          <img
            v-if="media.mime_type.startsWith('image/')"
            :src="getMediaUrl(media)"
            :alt="media.alt_text || media.filename"
            class="w-full h-full object-cover"
          />
          <div v-else class="text-base-content/30">
            <FileText v-if="media.mime_type === 'application/pdf'" class="w-10 h-10" />
            <FolderOpen v-else class="w-10 h-10" />
          </div>
        </figure>

        <!-- Info -->
        <div class="card-body p-3">
          <p class="text-sm font-medium truncate" :title="media.filename">
            {{ media.filename }}
          </p>
          <div v-if="media.alt_text" class="text-xs text-base-content/50 truncate" :title="media.alt_text">
            Alt: {{ media.alt_text }}
          </div>
          <div class="flex items-center justify-between text-xs text-base-content/50">
            <span>{{ formatFileSize(media.size) }}</span>
            <span>{{ formatDate(media.createdAt) }}</span>
          </div>
          <div class="flex gap-1 mt-2">
            <button
              v-if="media.mime_type.startsWith('image/')"
              class="btn btn-ghost btn-xs flex-1 gap-1 text-secondary"
              title="Generate alt text with AI"
              @click="handleGenerateAltText(media)"
            >
              <Sparkles class="w-3.5 h-3.5" />
              Alt Text
            </button>
            <button
              class="btn btn-ghost btn-xs flex-1 gap-1"
              :class="{ 'text-error': !media.mime_type.startsWith('image/') }"
              @click="handleDelete(media)"
              aria-label="Delete media"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-base-content/50">
      <FolderOpen class="w-14 h-14 mb-4 opacity-40" />
      <p class="text-lg">No media files found.</p>
      <p class="text-sm">Upload images, PDFs, or documents to get started.</p>
    </div>

    <!-- Pagination (join instead of btn-group) -->
    <div
      v-if="mediaStore.totalPages > 1"
      class="flex justify-center"
    >
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
          aria-label="Previous page"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          v-for="p in visiblePages"
          :key="p"
          class="join-item btn btn-sm"
          :class="{ 'btn-active': p === currentPage }"
          :aria-current="p === currentPage ? 'page' : undefined"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage >= mediaStore.totalPages"
          @click="goToPage(currentPage + 1)"
          aria-label="Next page"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- AI Alt Text Result Modal -->
    <AIActionModal
      :visible="aiModalVisible"
      title="Generate Alt Text"
      :loading="aiLoading"
      :result="aiResult"
      :error="aiError"
      :cost-kes="aiResult?.costKes"
      :show-accept="!!aiResult?.altText"
      accept-label="Apply Alt Text"
      @close="aiModalVisible = false"
      @accept="handleApplyAltText"
      @cancel="aiModalVisible = false"
    >
      <template #result>
        <div v-if="aiResult?.altText" class="space-y-3">
          <div class="alert alert-success text-sm">
            Alt text generated successfully
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Generated Alt Text</span></label>
            <textarea
              class="textarea textarea-bordered text-sm"
              rows="3"
              readonly
              :value="aiResult.altText"
            ></textarea>
          </div>
          <div v-if="aiTargetMedia" class="flex items-center gap-3 p-3 bg-base-200 rounded-box">
            <img
              :src="getMediaUrl(aiTargetMedia)"
              class="w-16 h-16 object-cover rounded"
              :alt="aiTargetMedia.filename"
            />
            <div class="text-sm">
              <p class="font-medium">{{ aiTargetMedia.filename }}</p>
              <p class="text-base-content/50">Image preview</p>
            </div>
          </div>
        </div>
      </template>
    </AIActionModal>

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
