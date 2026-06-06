<script setup>
/**
 * FactManagerPage.vue - Simple CRUD for county facts and statistics.
 * No workflow, direct save. Only admin/editor can manage.
 */
import { ref, onMounted } from 'vue'
import apiClient from '../../../api/axios'
import { useToast } from '../../../composables/useToast'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { Pencil, Trash2, Plus } from '@lucide/vue'

const facts = ref([])
const loading = ref(false)
const saving = ref(false)
const { addToast } = useToast()

// Edit modal state
const showModal = ref(false)
const editForm = ref({
  id: null,
  text_en: '',
  text_sw: '',
  text_pok: '',
  active: true,
  sort_order: 0,
})
const isEditing = ref(false)

// Confirm dialog
const confirmDialog = ref(null)

async function loadFacts() {
  loading.value = true
  try {
    const res = await apiClient.get('/admin/facts')
    facts.value = res.data.facts
  } catch (err) {
    addToast('Failed to load facts.', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editForm.value = { id: null, text_en: '', text_sw: '', text_pok: '', active: true, sort_order: 0 }
  showModal.value = true
}

function openEdit(fact) {
  isEditing.value = true
  editForm.value = { ...fact }
  showModal.value = true
}

async function handleSave() {
  if (!editForm.value.text_en) {
    addToast('English text is required.', 'error')
    return
  }
  saving.value = true
  try {
    if (isEditing.value) {
      await apiClient.put(`/admin/facts/${editForm.value.id}`, editForm.value)
      addToast('Fact updated successfully.', 'success')
    } else {
      await apiClient.post('/admin/facts', editForm.value)
      addToast('Fact created successfully.', 'success')
    }
    showModal.value = false
    await loadFacts()
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save fact.', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(fact) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Fact',
    message: `Delete this fact? "${fact.text_en.substring(0, 50)}..."`,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await apiClient.delete(`/admin/facts/${fact.id}`)
    addToast('Fact deleted.', 'success')
    await loadFacts()
  } catch (err) {
    addToast('Failed to delete fact.', 'error')
  }
}

function toggleActive(fact) {
  apiClient.put(`/admin/facts/${fact.id}`, { active: !fact.active })
    .then(() => {
      fact.active = !fact.active
    })
    .catch(() => addToast('Failed to toggle status.', 'error'))
}

onMounted(() => {
  loadFacts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Facts & Statistics</h1>
        <p class="text-base-content/60">Manage county facts displayed on the public website</p>
      </div>
      <button class="btn btn-primary gap-2" @click="openCreate">
        <Plus class="w-4 h-4" />
        New Fact
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Facts Table -->
    <div v-else class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>English Text</th>
                <th>Swahili Text</th>
                <th>Pokot Text</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fact, index) in facts" :key="fact.id">
                <td>{{ index + 1 }}</td>
                <td class="max-w-xs truncate">{{ fact.text_en }}</td>
                <td class="max-w-xs truncate">{{ fact.text_sw || '—' }}</td>
                <td class="max-w-xs truncate">{{ fact.text_pok || '—' }}</td>
                <td>{{ fact.sort_order }}</td>
                <td>
                  <button
                    class="badge cursor-pointer"
                    :class="fact.active ? 'badge-success' : 'badge-ghost'"
                    @click="toggleActive(fact)"
                    :aria-label="fact.active ? 'Deactivate fact' : 'Activate fact'"
                  >
                    {{ fact.active ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs gap-1" @click="openEdit(fact)" aria-label="Edit fact">
                      <Pencil class="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button class="btn btn-ghost btn-xs text-error gap-1" @click="handleDelete(fact)" aria-label="Delete fact">
                      <Trash2 class="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!facts.length">
                <td colspan="7" class="text-center text-base-content/50 py-8">
                  No facts yet. Click "+ New Fact" to create one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          {{ isEditing ? 'Edit Fact' : 'New Fact' }}
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">English Text *</span>
            </label>
            <textarea
              v-model="editForm.text_en"
              class="textarea textarea-bordered h-24"
              placeholder="Enter fact in English"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Swahili Text</span>
            </label>
            <textarea
              v-model="editForm.text_sw"
              class="textarea textarea-bordered h-24"
              placeholder="Enter fact in Swahili"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Pokot Text</span>
            </label>
            <textarea
              v-model="editForm.text_pok"
              class="textarea textarea-bordered h-24"
              placeholder="Enter fact in Pokot"
            ></textarea>
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

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
