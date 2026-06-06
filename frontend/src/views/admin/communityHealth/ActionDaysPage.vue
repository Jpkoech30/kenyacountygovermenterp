<script setup>
/**
 * ActionDaysPage.vue
 * Manage Community Action Days - list, create, edit, delete.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseTextarea from '../../../components/forms/BaseTextarea.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const showModal = ref(false)
const editingActionDay = ref(null)

const schema = yup.object({
  community_unit_id: yup.string(),
  title: yup.string().required('Title is required'),
  date: yup.string().required('Date is required'),
  activity_type: yup.string().required('Activity type is required'),
  venue: yup.string(),
  coordinator: yup.string(),
  total_participants: yup.number().min(0, 'Cannot be negative').typeError('Must be a number'),
  resources_used: yup.string(),
  outcomes: yup.string(),
  status: yup.string().required('Status is required'),
})

const { handleSubmit, isSubmitting, resetForm } = useFormValidation(schema, {
  community_unit_id: '',
  title: '',
  date: '',
  activity_type: 'clean_up',
  venue: '',
  coordinator: '',
  total_participants: 0,
  resources_used: '',
  outcomes: '',
  status: 'planned',
})

const activityTypeOptions = [
  { value: 'clean_up', label: 'Clean-up' },
  { value: 'health_screening', label: 'Health Screening' },
  { value: 'vaccination_drive', label: 'Vaccination Drive' },
  { value: 'health_education', label: 'Health Education' },
  { value: 'tree_planting', label: 'Tree Planting' },
  { value: 'mosquito_net_distribution', label: 'Mosquito Net Distribution' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

onMounted(async () => {
  await Promise.all([
    loadActionDays(),
    store.fetchCommunityUnits({ limit: 200 }),
  ])
})

async function loadActionDays() {
  loading.value = true
  try {
    const params = { page: store.actionDaysPagination.page }
    await store.fetchActionDays(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingActionDay.value = null
  resetForm({ values: { community_unit_id: '', title: '', date: '', activity_type: 'clean_up', venue: '', coordinator: '', total_participants: 0, resources_used: '', outcomes: '', status: 'planned' } })
  showModal.value = true
}

function openEditModal(actionDay) {
  editingActionDay.value = actionDay
  resetForm({ values: {
    community_unit_id: actionDay.community_unit_id || '',
    title: actionDay.title,
    date: actionDay.date ? actionDay.date.split('T')[0] : '',
    activity_type: actionDay.activity_type || 'clean_up',
    venue: actionDay.venue || '',
    coordinator: actionDay.coordinator || '',
    total_participants: actionDay.total_participants || 0,
    resources_used: actionDay.resources_used ? JSON.stringify(actionDay.resources_used) : '',
    outcomes: actionDay.outcomes || '',
    status: actionDay.status,
  } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = { ...values }
    if (payload.resources_used) {
      try { payload.resources_used = JSON.parse(payload.resources_used) } catch { payload.resources_used = {} }
    }
    if (editingActionDay.value) {
      await store.updateActionDay(editingActionDay.value.id, payload)
    } else {
      await store.createActionDay(payload)
    }
    showModal.value = false
    await loadActionDays()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save action day'
    resetForm({ errors: { title: msg } })
  }
})

async function confirmDelete(actionDay) {
  if (!confirm(`Delete action day "${actionDay.title}"?`)) return
  try {
    await store.deleteActionDay(actionDay.id)
    await loadActionDays()
  } catch (err) {
    console.error('Failed to delete action day:', err)
  }
}

function goToPage(page) {
  store.actionDaysPagination.page = page
  loadActionDays()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Community Action Days</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Action Day
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Activity Type</th>
            <th>Venue</th>
            <th>Unit</th>
            <th>Participants</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.actionDays.length === 0">
            <td colspan="8" class="text-center text-base-content/60 py-8">No action days found.</td>
          </tr>
          <tr v-for="day in store.actionDays" :key="day.id">
            <td class="font-medium">{{ day.title }}</td>
            <td>{{ day.date ? new Date(day.date).toLocaleDateString() : '-' }}</td>
            <td><span class="badge badge-sm badge-outline">{{ day.activity_type?.replace(/_/g, ' ') }}</span></td>
            <td>{{ day.venue }}</td>
            <td>{{ day.community_unit?.code || day.community_unit_id }}</td>
            <td>{{ day.total_participants || 0 }}</td>
            <td>
              <span class="badge badge-sm" :class="day.status === 'completed' ? 'badge-success' : day.status === 'cancelled' ? 'badge-error' : 'badge-info'">
                {{ day.status }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="openEditModal(day)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(day)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.actionDaysPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.actionDaysPagination.page <= 1" @click="goToPage(store.actionDaysPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.actionDaysPagination.totalPages" :key="p" :class="{'btn-active': p === store.actionDaysPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.actionDaysPagination.page >= store.actionDaysPagination.totalPages" @click="goToPage(store.actionDaysPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingActionDay ? 'Edit' : 'New' }} Community Action Day</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseInput name="title" label="Title" required placeholder="Enter title" />

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="community_unit_id" label="Community Unit" :options="[{value:'',label:'Select unit...'},...store.communityUnits.map(u=>({value:u.id,label:u.name+' ('+u.code+')'}))]" />
            <BaseSelect name="activity_type" label="Activity Type" :options="activityTypeOptions" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="date" label="Date" type="date" required />
            <BaseInput name="venue" label="Venue" placeholder="Enter venue" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="coordinator" label="Coordinator" placeholder="Enter coordinator name" />
            <BaseInput name="total_participants" label="Total Participants" type="number" />
          </div>

          <BaseTextarea name="resources_used" label="Resources Used (JSON)" rows="2" placeholder='{"gloves":100,"masks":50}' />

          <BaseTextarea name="outcomes" label="Outcomes" rows="3" />

          <BaseSelect name="status" label="Status" :options="statusOptions" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingActionDay ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>
  </div>
</template>
