<script setup>
/**
 * AssistantsPage.vue
 * Manage Community Health Assistants (CHAs) - list, create, edit, delete.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseCheckbox from '../../../components/forms/BaseCheckbox.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const showModal = ref(false)
const editingAssistant = ref(null)
const search = ref('')

const schema = yup.object({
  employee_id: yup.string(),
  full_name: yup.string().required('Full name is required'),
  national_id: yup.string().matches(/^\d{8}$/, 'National ID must be exactly 8 digits').required('National ID is required'),
  phone: yup.string().matches(/^(07|01)\d{8}$/, 'Phone must start with 07 or 01 and have 10 digits'),
  email: yup.string().email('Invalid email format'),
  sub_county: yup.string(),
  assigned_units: yup.string(),
  is_active: yup.boolean(),
})

const { handleSubmit, isSubmitting, resetForm } = useFormValidation(schema, {
  employee_id: '',
  full_name: '',
  national_id: '',
  phone: '',
  email: '',
  sub_county: '',
  assigned_units: '',
  is_active: true,
})

onMounted(async () => {
  await loadAssistants()
})

async function loadAssistants() {
  loading.value = true
  try {
    const params = { page: store.assistantsPagination.page }
    if (search.value) params.search = search.value
    await store.fetchAssistants(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingAssistant.value = null
  resetForm({ values: { employee_id: '', full_name: '', national_id: '', phone: '', email: '', sub_county: '', assigned_units: '', is_active: true } })
  showModal.value = true
}

function openEditModal(assistant) {
  editingAssistant.value = assistant
  resetForm({ values: {
    employee_id: assistant.employee_id || '',
    full_name: assistant.full_name,
    national_id: assistant.national_id,
    phone: assistant.phone || '',
    email: assistant.email || '',
    sub_county: assistant.sub_county || '',
    assigned_units: assistant.assigned_units || '',
    is_active: assistant.is_active,
  } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (editingAssistant.value) {
      await store.updateAssistant(editingAssistant.value.id, values)
    } else {
      await store.createAssistant(values)
    }
    showModal.value = false
    await loadAssistants()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save assistant'
    resetForm({ errors: { full_name: msg } })
  }
})

async function confirmDelete(assistant) {
  if (!confirm(`Delete CHA "${assistant.full_name}"?`)) return
  try {
    await store.deleteAssistant(assistant.id)
    await loadAssistants()
  } catch (err) {
    console.error('Failed to delete assistant:', err)
  }
}

function goToPage(page) {
  store.assistantsPagination.page = page
  loadAssistants()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Community Health Assistants</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New CHA
      </button>
    </div>

    <div class="form-control w-full max-w-xs">
      <div class="input-group">
        <input type="text" v-model="search" placeholder="Search CHAs..." class="input input-bordered w-full" @keyup.enter="loadAssistants" />
        <button class="btn btn-square" @click="loadAssistants">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>National ID</th>
            <th>Phone</th>
            <th>Sub-County</th>
            <th>Assigned Units</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.assistants.length === 0">
            <td colspan="7" class="text-center text-base-content/60 py-8">No CHAs found.</td>
          </tr>
          <tr v-for="assistant in store.assistants" :key="assistant.id">
            <td class="font-medium">{{ assistant.full_name }}</td>
            <td>{{ assistant.national_id }}</td>
            <td>{{ assistant.phone }}</td>
            <td>{{ assistant.sub_county }}</td>
            <td>{{ assistant.assigned_units }}</td>
            <td>
              <span class="badge badge-sm" :class="assistant.is_active ? 'badge-success' : 'badge-ghost'">
                {{ assistant.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="openEditModal(assistant)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(assistant)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.assistantsPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.assistantsPagination.page <= 1" @click="goToPage(store.assistantsPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.assistantsPagination.totalPages" :key="p" :class="{'btn-active': p === store.assistantsPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.assistantsPagination.page >= store.assistantsPagination.totalPages" @click="goToPage(store.assistantsPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingAssistant ? 'Edit' : 'New' }} Community Health Assistant</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseInput name="full_name" label="Full Name" required placeholder="Enter full name" />

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="national_id" label="National ID" required placeholder="8-digit ID" />
            <BaseInput name="employee_id" label="Employee ID" placeholder="Optional" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="phone" label="Phone" type="tel" placeholder="0712345678" />
            <BaseInput name="email" label="Email" type="email" placeholder="email@example.com" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="sub_county" label="Sub-County" placeholder="Enter sub-county" />
            <BaseInput name="assigned_units" label="Assigned Units" placeholder="e.g., CHU-001, CHU-002" />
          </div>

          <BaseCheckbox name="is_active" label="Active" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingAssistant ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>
  </div>
</template>
