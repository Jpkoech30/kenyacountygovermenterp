<script setup>
/**
 * HeroSlideManagerPage.vue - Simple CRUD for hero slides on the public website.
 * No workflow, direct save. Only admin/editor can manage.
 */
import { ref, onMounted } from 'vue'
import apiClient from '../../../api/axios'
import MediaLibraryModal from '../../../components/MediaLibraryModal.vue'
import { useToast } from '../../../composables/useToast'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { Pencil, Trash2, Plus, Link, X } from '@lucide/vue'

const slides = ref([])
const loading = ref(false)
const saving = ref(false)
const { addToast } = useToast()

// Edit modal state
const showModal = ref(false)
const showMediaModal = ref(false)
const editForm = ref({
  id: null,
  image_id: null,
  image_url: '',
  link_url: '',
  sort_order: 0,
  active: true,
})
const isEditing = ref(false)

// Confirm dialog
const confirmDialog = ref(null)

async function loadSlides() {
  loading.value = true
  try {
    const res = await apiClient.get('/admin/hero-slides')
    slides.value = res.data.slides
  } catch (err) {
    addToast('Failed to load hero slides.', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editForm.value = { id: null, image_id: null, image_url: '', link_url: '', sort_order: 0, active: true }
  showModal.value = true
}

function openEdit(slide) {
  isEditing.value = true
  editForm.value = {
    ...slide,
    image_url: slide.image ? `/media/${slide.image.disk_filename}` : '',
  }
  showModal.value = true
}

function openMediaPicker() {
  showMediaModal.value = true
}

function handleMediaSelect(media) {
  editForm.value.image_id = media.id
  editForm.value.image_url = `/media/${media.disk_filename}`
  showMediaModal.value = false
}

function removeImage() {
  editForm.value.image_id = null
  editForm.value.image_url = ''
}

async function handleSave() {
  if (!editForm.value.image_id) {
    addToast('Please select an image.', 'error')
    return
  }
  saving.value = true
  try {
    const payload = {
      image_id: editForm.value.image_id,
      link_url: editForm.value.link_url || null,
      sort_order: editForm.value.sort_order || 0,
      active: editForm.value.active,
    }

    if (isEditing.value) {
      await apiClient.put(`/admin/hero-slides/${editForm.value.id}`, payload)
      addToast('Hero slide updated successfully.', 'success')
    } else {
      await apiClient.post('/admin/hero-slides', payload)
      addToast('Hero slide created successfully.', 'success')
    }
    showModal.value = false
    await loadSlides()
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save hero slide.', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(slide) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Hero Slide',
    message: 'Delete this hero slide? This cannot be undone.',
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await apiClient.delete(`/admin/hero-slides/${slide.id}`)
    addToast('Hero slide deleted.', 'success')
    await loadSlides()
  } catch (err) {
    addToast('Failed to delete hero slide.', 'error')
  }
}

function toggleActive(slide) {
  apiClient.put(`/admin/hero-slides/${slide.id}`, { active: !slide.active })
    .then(() => {
      slide.active = !slide.active
    })
    .catch(() => addToast('Failed to toggle status.', 'error'))
}

onMounted(() => {
  loadSlides()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Hero Slides</h1>
        <p class="text-base-content/60">Manage rotating hero slides on the public website homepage</p>
      </div>
      <button class="btn btn-primary gap-2" @click="openCreate">
        <Plus class="w-4 h-4" />
        New Slide
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Slides Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="slide in slides" :key="slide.id" class="card bg-base-100 shadow-sm">
        <figure class="h-40 overflow-hidden">
          <img
            v-if="slide.image"
            :src="`/media/${slide.image.disk_filename}`"
            :alt="`Slide ${slide.sort_order}`"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex items-center justify-center h-full bg-base-200 text-base-content/40">
            No Image
          </div>
        </figure>
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <span class="badge badge-sm">Order: {{ slide.sort_order }}</span>
            <button
              class="badge cursor-pointer"
              :class="slide.active ? 'badge-success' : 'badge-ghost'"
              @click="toggleActive(slide)"
              :aria-label="slide.active ? 'Deactivate slide' : 'Activate slide'"
            >
              {{ slide.active ? 'Active' : 'Inactive' }}
            </button>
          </div>
          <p v-if="slide.link_url" class="text-sm truncate mt-1 flex items-center gap-1">
            <Link class="w-3.5 h-3.5 inline" />
            {{ slide.link_url }}
          </p>
          <p v-else class="text-sm text-base-content/40 mt-1">No link</p>
          <div class="card-actions justify-end mt-2">
            <button class="btn btn-ghost btn-xs gap-1" @click="openEdit(slide)" aria-label="Edit slide">
              <Pencil class="w-3.5 h-3.5" />
              Edit
            </button>
            <button class="btn btn-ghost btn-xs text-error gap-1" @click="handleDelete(slide)" aria-label="Delete slide">
              <Trash2 class="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!slides.length" class="col-span-full text-center text-base-content/50 py-12">
        No hero slides yet. Click "+ New Slide" to create one.
      </div>
    </div>

    <!-- Edit/Create Modal (DaisyUI dialog) -->
    <dialog
      :open="showModal"
      class="modal modal-bottom sm:modal-middle"
      @click.self="showModal = false"
    >
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ isEditing ? 'Edit Hero Slide' : 'New Hero Slide' }}
        </h3>

        <div class="space-y-4">
          <!-- Image Selection -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Image *</span>
            </label>
            <div v-if="editForm.image_url" class="relative mb-2">
              <img
                :src="editForm.image_url"
                class="w-full h-32 object-cover rounded-lg"
                alt="Selected image"
              />
              <button
                class="btn btn-circle btn-xs btn-error absolute top-1 right-1"
                @click="removeImage"
                aria-label="Remove image"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <button class="btn btn-outline btn-sm" @click="openMediaPicker">
              {{ editForm.image_id ? 'Change Image' : 'Select from Media Library' }}
            </button>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Link URL (optional)</span>
            </label>
            <input
              v-model="editForm.link_url"
              type="url"
              class="input input-bordered"
              placeholder="https://example.com/page"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Sort Order</span>
            </label>
            <input
              v-model.number="editForm.sort_order"
              type="number"
              class="input input-bordered"
              min="0"
            />
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                v-model="editForm.active"
              />
              <span class="label-text">Active</span>
            </label>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleSave">
            {{ saving ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>

    <!-- Media Library Modal -->
    <MediaLibraryModal
      :show="showMediaModal"
      @close="showMediaModal = false"
      @select="handleMediaSelect"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
