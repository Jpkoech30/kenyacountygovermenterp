<script setup>
/**
 * VolunteersPage.vue
 * Manage Community Health Volunteers (CHVs) - list, create, edit, delete.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const showModal = ref(false)
const editingVolunteer = ref(null)
const search = ref('')

const schema = yup.object({
  community_unit_id: yup.string(),
  cha_id: yup.string(),
  full_name: yup.string().required('Full name is required'),
  national_id: yup.string().matches(/^\d{8}$/, 'National ID must be exactly 8 digits').required('National ID is required'),
  phone: yup.string().matches(/^(07|01)\d{8}$/, 'Phone must start with 07 or 01 and have 10 digits'),
  village: yup.string(),
  household_assignments: yup.number().min(0, 'Cannot be negative'),
  training_level: yup.string().required('Training level is required'),
  trained_date: yup.string(),
  certification_date: yup.string(),
  status: yup.string().required('Status is required'),
})

const { handleSubmit, isSubmitting, resetForm, errors } = useFormValidation(schema, {
  community_unit_id: '',
  cha_id: '',
  full_name: '',
  national_id: '',
  phone: '',
  village: '',
  household_assignments: 0,
  training_level: 'basic',
  trained_date: '',
  certification_date: '',
  status: 'active',
})

const trainingLevelOptions = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

onMounted(async () => {
  await Promise.all([
    loadVolunteers(),
    store.fetchCommunityUnits({ limit: 200 }),
    store.fetchAssistants({ limit: 200 }),
  ])
})

async function loadVolunteers() {
  loading.value = true
  try {
    const params = { page: store.volunteersPagination.page }
    if (search.value) params.search = search.value
    await store.fetchVolunteers(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingVolunteer.value = null
  resetForm({ values: { community_unit_id: '', cha_id: '', full_name: '', national_id: '', phone: '', village: '', household_assignments: 0, training_level: 'basic', trained_date: '', certification_date: '', status: 'active' } })
  showModal.value = true
}

function openEditModal(volunteer) {
  editingVolunteer.value = volunteer
  resetForm({ values: {
    community_unit_id: volunteer.community_unit_id || '',
    cha_id: volunteer.cha_id || '',
    full_name: volunteer.full_name,
    national_id: volunteer.national_id,
    phone: volunteer.phone || '',
    village: volunteer.village || '',
    household_assignments: volunteer.household_assignments || 0,
    training_level: volunteer.training_level || 'basic',
    trained_date: volunteer.trained_date ? volunteer.trained_date.split('T')[0] : '',
    certification_date: volunteer.certification_date ? volunteer.certification_date.split('T')[0] : '',
    status: volunteer.status,
  } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (editingVolunteer.value) {
      await store.updateVolunteer(editingVolunteer.value.id, values)
    } else {
      await store.createVolunteer(values)
    }
    showModal.value = false
    await loadVolunteers()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save CHV'
    resetForm({ errors: { full_name: msg } })
  }
})

async function confirmDelete(volunteer) {
  if (!confirm(`Delete CHV "${volunteer.full_name}"?`)) return
  try {
    await store.deleteVolunteer(volunteer.id)
    await loadVolunteers()
  } catch (err) {
    console.error('Failed to delete CHV:', err)
  }
}

function goToPage(page) {
  store.volunteersPagination.page = page
  loadVolunteers()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Community Health Volunteers</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New CHV
      </button>
    </div>

    <div class="form-control w-full max-w-xs">
      <div class="input-group">
        <input type="text" v-model="search" placeholder="Search CHVs..." class="input input-bordered w-full" @keyup.enter="loadVolunteers" />
        <button class="btn btn-square" @click="loadVolunteers">
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
            <th>Unit</th>
            <th>Training</th>
            <th>Households</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.volunteers.length === 0">
            <td colspan="8" class="text-center text-base-content/60 py-8">No CHVs found.</td>
          </tr>
          <tr v-for="chv in store.volunteers" :key="chv.id">
            <td class="font-medium">{{ chv.full_name }}</td>
            <td>{{ chv.national_id }}</td>
            <td>{{ chv.phone }}</td>
            <td>{{ chv.community_unit?.name || chv.community_unit_id }}</td>
            <td><span class="badge badge-sm badge-outline">{{ chv.training_level || 'N/A' }}</span></td>
            <td>{{ chv.household_assignments || 0 }}</td>
            <td>
              <span class="badge badge-sm" :class="chv.status === 'active' ? 'badge-success' : chv.status === 'suspended' ? 'badge-warning' : 'badge-ghost'">
                {{ chv.status }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="openEditModal(chv)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(chv)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.volunteersPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.volunteersPagination.page <= 1" @click="goToPage(store.volunteersPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.volunteersPagination.totalPages" :key="p" :class="{'btn-active': p === store.volunteersPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.volunteersPagination.page >= store.volunteersPagination.totalPages" @click="goToPage(store.volunteersPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingVolunteer ? 'Edit' : 'New' }} CHV</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseInput name="full_name" label="Full Name" required placeholder="Enter full name" />

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="national_id" label="National ID" required placeholder="8-digit ID" />
            <BaseInput name="phone" label="Phone" type="tel" placeholder="0712345678" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="community_unit_id" label="Community Unit" :options="[{value:'',label:'Select unit...'},...store.communityUnits.map(u=>({value:u.id,label:u.name+' ('+u.code+')'}))]" />
            <BaseSelect name="cha_id" label="CHA" :options="[{value:'',label:'Select CHA...'},...store.assistants.map(a=>({value:a.id,label:a.full_name}))]" />
          </div>

          <BaseInput name="village" label="Village" placeholder="Enter village name" />

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="training_level" label="Training Level" :options="trainingLevelOptions" />
            <BaseSelect name="status" label="Status" :options="statusOptions" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="trained_date" label="Trained Date" type="date" />
            <BaseInput name="certification_date" label="Certification Date" type="date" />
          </div>

          <BaseInput name="household_assignments" label="Household Assignments" type="number" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingVolunteer ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>
  </div>
</template>
