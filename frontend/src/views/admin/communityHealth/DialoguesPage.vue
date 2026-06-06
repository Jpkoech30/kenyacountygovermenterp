<script setup>
/**
 * DialoguesPage.vue
 * Manage Community Dialogues - list, create, edit, delete.
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
const editingDialogue = ref(null)

const schema = yup.object({
  community_unit_id: yup.string(),
  title: yup.string().required('Title is required'),
  date: yup.string().required('Date is required'),
  venue: yup.string(),
  topic: yup.string(),
  facilitator: yup.string(),
  total_attendees: yup.number().min(0, 'Cannot be negative').typeError('Must be a number'),
  male_attendees: yup.number().min(0, 'Cannot be negative').typeError('Must be a number'),
  female_attendees: yup.number().min(0, 'Cannot be negative').typeError('Must be a number'),
  youth_attendees: yup.number().min(0, 'Cannot be negative').typeError('Must be a number'),
  key_discussion_points: yup.string(),
  action_items: yup.string(),
  status: yup.string().required('Status is required'),
})

const { handleSubmit, isSubmitting, resetForm } = useFormValidation(schema, {
  community_unit_id: '',
  title: '',
  date: '',
  venue: '',
  topic: '',
  facilitator: '',
  total_attendees: 0,
  male_attendees: 0,
  female_attendees: 0,
  youth_attendees: 0,
  key_discussion_points: '',
  action_items: '',
  status: 'planned',
})

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

onMounted(async () => {
  await Promise.all([
    loadDialogues(),
    store.fetchCommunityUnits({ limit: 200 }),
  ])
})

async function loadDialogues() {
  loading.value = true
  try {
    const params = { page: store.dialoguesPagination.page }
    await store.fetchDialogues(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingDialogue.value = null
  resetForm({ values: { community_unit_id: '', title: '', date: '', venue: '', topic: '', facilitator: '', total_attendees: 0, male_attendees: 0, female_attendees: 0, youth_attendees: 0, key_discussion_points: '', action_items: '', status: 'planned' } })
  showModal.value = true
}

function openEditModal(dialogue) {
  editingDialogue.value = dialogue
  resetForm({ values: {
    community_unit_id: dialogue.community_unit_id || '',
    title: dialogue.title,
    date: dialogue.date ? dialogue.date.split('T')[0] : '',
    venue: dialogue.venue || '',
    topic: dialogue.topic || '',
    facilitator: dialogue.facilitator || '',
    total_attendees: dialogue.total_attendees || 0,
    male_attendees: dialogue.male_attendees || 0,
    female_attendees: dialogue.female_attendees || 0,
    youth_attendees: dialogue.youth_attendees || 0,
    key_discussion_points: dialogue.key_discussion_points || '',
    action_items: dialogue.action_items ? JSON.stringify(dialogue.action_items) : '',
    status: dialogue.status,
  } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = { ...values }
    if (payload.action_items) {
      try { payload.action_items = JSON.parse(payload.action_items) } catch { payload.action_items = [] }
    }
    if (editingDialogue.value) {
      await store.updateDialogue(editingDialogue.value.id, payload)
    } else {
      await store.createDialogue(payload)
    }
    showModal.value = false
    await loadDialogues()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save dialogue'
    resetForm({ errors: { title: msg } })
  }
})

async function confirmDelete(dialogue) {
  if (!confirm(`Delete dialogue "${dialogue.title}"?`)) return
  try {
    await store.deleteDialogue(dialogue.id)
    await loadDialogues()
  } catch (err) {
    console.error('Failed to delete dialogue:', err)
  }
}

function goToPage(page) {
  store.dialoguesPagination.page = page
  loadDialogues()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Community Dialogues</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Dialogue
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
            <th>Venue</th>
            <th>Unit</th>
            <th>Attendees</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.dialogues.length === 0">
            <td colspan="7" class="text-center text-base-content/60 py-8">No dialogues found.</td>
          </tr>
          <tr v-for="dialogue in store.dialogues" :key="dialogue.id">
            <td class="font-medium">{{ dialogue.title }}</td>
            <td>{{ dialogue.date ? new Date(dialogue.date).toLocaleDateString() : '-' }}</td>
            <td>{{ dialogue.venue }}</td>
            <td>{{ dialogue.community_unit?.code || dialogue.community_unit_id }}</td>
            <td>{{ dialogue.total_attendees || 0 }}</td>
            <td>
              <span class="badge badge-sm" :class="dialogue.status === 'completed' ? 'badge-success' : dialogue.status === 'cancelled' ? 'badge-error' : 'badge-info'">
                {{ dialogue.status }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="openEditModal(dialogue)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(dialogue)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.dialoguesPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.dialoguesPagination.page <= 1" @click="goToPage(store.dialoguesPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.dialoguesPagination.totalPages" :key="p" :class="{'btn-active': p === store.dialoguesPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.dialoguesPagination.page >= store.dialoguesPagination.totalPages" @click="goToPage(store.dialoguesPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingDialogue ? 'Edit' : 'New' }} Community Dialogue</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseInput name="title" label="Title" required placeholder="Enter title" />

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="community_unit_id" label="Community Unit" :options="[{value:'',label:'Select unit...'},...store.communityUnits.map(u=>({value:u.id,label:u.name+' ('+u.code+')'}))]" />
            <BaseSelect name="status" label="Status" :options="statusOptions" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="date" label="Date" type="date" required />
            <BaseInput name="venue" label="Venue" placeholder="Enter venue" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="topic" label="Topic" placeholder="Enter discussion topic" />
            <BaseInput name="facilitator" label="Facilitator" placeholder="Enter facilitator name" />
          </div>

          <BaseTextarea name="key_discussion_points" label="Key Discussion Points" rows="3" />

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="total_attendees" label="Total Attendees" type="number" />
            <BaseInput name="male_attendees" label="Male" type="number" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="female_attendees" label="Female" type="number" />
            <BaseInput name="youth_attendees" label="Youth" type="number" />
          </div>

          <BaseTextarea name="action_items" label="Action Items (JSON array)" rows="2" placeholder='["Follow up on malaria cases","Schedule next dialogue"]' />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingDialogue ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>
  </div>
</template>
