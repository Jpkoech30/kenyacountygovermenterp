<script setup>
/**
 * CategoryManagerPage.vue - Manage categories and tags (taxonomies).
 * Supports CRUD operations for both categories and tags.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useTaxonomyStore } from '../../stores/taxonomy'
import { useToast } from '../../composables/useToast'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { Folder, Tags, Pencil, Trash2, Plus } from '@lucide/vue'

const taxonomyStore = useTaxonomyStore()
const { addToast } = useToast()

// Active tab
const activeTab = ref('category')

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  slug: '',
  type: 'category',
  parent_id: null,
})

// Confirm dialog
const confirmDialog = ref(null)

// Load taxonomies
async function loadData() {
  try {
    await taxonomyStore.fetchTaxonomies({ type: activeTab.value })
  } catch (err) {
    addToast('Failed to load taxonomies.', 'error')
  }
}

onMounted(() => {
  loadData()
})

watch(activeTab, () => {
  loadData()
})

// Form actions
function openCreate() {
  editingItem.value = null
  form.value = {
    name: '',
    slug: '',
    type: activeTab.value,
    parent_id: null,
  }
  showForm.value = true
}

function openEdit(item) {
  editingItem.value = item
  form.value = {
    name: item.name,
    slug: item.slug,
    type: item.type,
    parent_id: item.parent_id,
  }
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingItem.value = null
}

async function saveForm() {
  try {
    if (editingItem.value) {
      await taxonomyStore.updateTaxonomy(editingItem.value.id, form.value)
      addToast('Taxonomy updated.', 'success')
    } else {
      await taxonomyStore.createTaxonomy(form.value)
      addToast('Taxonomy created.', 'success')
    }
    showForm.value = false
    editingItem.value = null
    await loadData()
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save taxonomy.', 'error')
  }
}

async function handleDelete(item) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Taxonomy',
    message: `Delete "${item.name}"? This cannot be undone.`,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await taxonomyStore.deleteTaxonomy(item.id)
    addToast('Taxonomy deleted.', 'success')
    await loadData()
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to delete taxonomy.', 'error')
  }
}

// Auto-generate slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

watch(
  () => form.value.name,
  (name) => {
    if (!editingItem.value && name) {
      form.value.slug = generateSlug(name)
    }
  }
)

// Computed
const currentItems = computed(() => {
  return taxonomyStore.taxonomies.filter((t) => t.type === activeTab.value)
})

const parentOptions = computed(() => {
  return currentItems.value.filter((item) => item.id !== editingItem.value?.id)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Categories & Tags</h1>
        <p class="text-base-content/60">Manage content classification</p>
      </div>
      <button class="btn btn-primary gap-2" @click="openCreate">
        <Plus class="w-4 h-4" />
        New {{ activeTab === 'category' ? 'Category' : 'Tag' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-boxed bg-base-200">
      <button
        class="tab gap-2"
        :class="{ 'tab-active': activeTab === 'category' }"
        @click="activeTab = 'category'"
      >
        <Folder class="w-4 h-4" />
        Categories
      </button>
      <button
        class="tab gap-2"
        :class="{ 'tab-active': activeTab === 'tag' }"
        @click="activeTab = 'tag'"
      >
        <Tags class="w-4 h-4" />
        Tags
      </button>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="card bg-base-200 shadow-sm">
      <div class="card-body">
        <h3 class="font-semibold">
          {{ editingItem ? 'Edit' : 'New' }} {{ activeTab === 'category' ? 'Category' : 'Tag' }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered"
              placeholder="e.g., Agriculture"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Slug</span>
            </label>
            <input
              v-model="form.slug"
              type="text"
              class="input input-bordered"
              placeholder="e.g., agriculture"
            />
          </div>
          <div v-if="activeTab === 'category'" class="form-control">
            <label class="label">
              <span class="label-text">Parent Category</span>
            </label>
            <select v-model="form.parent_id" class="select select-bordered">
              <option :value="null">None (top level)</option>
              <option
                v-for="parent in parentOptions"
                :key="parent.id"
                :value="parent.id"
              >
                {{ parent.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary" @click="saveForm">Save</button>
          <button class="btn btn-ghost" @click="cancelForm">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="taxonomyStore.loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Items List -->
    <div v-else-if="currentItems.length" class="card bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th v-if="activeTab === 'category'">Parent</th>
              <th>Items</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentItems" :key="item.id">
              <td class="font-medium">{{ item.name }}</td>
              <td class="text-sm text-base-content/50">{{ item.slug }}</td>
              <td v-if="activeTab === 'category'" class="text-sm">
                {{ item.parent?.name || '—' }}
              </td>
              <td class="text-sm">{{ item.children?.length || 0 }} sub-items</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-xs gap-1" @click="openEdit(item)" aria-label="Edit taxonomy">
                  <Pencil class="w-3.5 h-3.5" />
                  Edit
                </button>
                <button class="btn btn-ghost btn-xs text-error gap-1" @click="handleDelete(item)" aria-label="Delete taxonomy">
                  <Trash2 class="w-3.5 h-3.5" />
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-base-content/50">
      <Folder v-if="activeTab === 'category'" class="w-12 h-12 mb-3 opacity-40" />
      <Tags v-else class="w-12 h-12 mb-3 opacity-40" />
      <p>No {{ activeTab === 'category' ? 'categories' : 'tags' }} yet.</p>
      <p class="text-sm">Create your first one to get started.</p>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
