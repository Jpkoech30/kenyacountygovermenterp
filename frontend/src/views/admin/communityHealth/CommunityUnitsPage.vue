<script setup>
/**
 * CommunityUnitsPage.vue
 * Manage Community Health Units (CHUs) - list, create, edit, delete.
 * Includes committee member management per unit.
 * Uses vee-validate + Yup validation with base form components.
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
const showCommitteeModal = ref(false)
const editingUnit = ref(null)
const selectedUnit = ref(null)
const search = ref('')

const formError = ref('')
const saving = ref(false)

// Unit form schema
const unitSchema = yup.object({
  name: yup.string().required('Unit name is required').min(3, 'Name must be at least 3 characters'),
  code: yup.string().required('Unit code is required'),
  ward: yup.string(),
  sub_county: yup.string(),
  village: yup.string(),
  status: yup.string().required('Status is required'),
  established_date: yup.string(),
  total_households: yup.number().min(0).typeError('Must be a number'),
  total_chvs: yup.number().min(0).typeError('Must be a number'),
})

const {
  handleSubmit: handleUnitSubmit,
  isSubmitting: isUnitSubmitting,
  resetForm: resetUnitForm,
  errors: unitErrors,
} = useFormValidation(unitSchema, {
  name: '',
  code: '',
  ward: '',
  sub_county: '',
  village: '',
  status: 'active',
  established_date: '',
  total_households: 0,
  total_chvs: 0,
})

// Committee form (simple, not using vee-validate)
const committeeForm = ref({
  full_name: '',
  role: '',
  phone: '',
  email: '',
  elected_date: '',
  term_end_date: '',
  is_active: true,
})

const committeeSaving = ref(false)

onMounted(async () => {
  await loadUnits()
})

async function loadUnits() {
  loading.value = true
  try {
    const params = { page: store.communityUnitsPagination.page }
    if (search.value) params.search = search.value
    await store.fetchCommunityUnits(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingUnit.value = null
  resetUnitForm({
    values: {
      name: '',
      code: '',
      ward: '',
      sub_county: '',
      village: '',
      status: 'active',
      established_date: '',
      total_households: 0,
      total_chvs: 0,
    },
  })
  formError.value = ''
  showModal.value = true
}

function openEditModal(unit) {
  editingUnit.value = unit
  resetUnitForm({
    values: {
      name: unit.name,
      code: unit.code,
      ward: unit.ward || '',
      sub_county: unit.sub_county || '',
      village: unit.village || '',
      status: unit.status,
      established_date: unit.established_date ? unit.established_date.split('T')[0] : '',
      total_households: unit.total_households || 0,
      total_chvs: unit.total_chvs || 0,
    },
  })
  formError.value = ''
  showModal.value = true
}

const onSaveUnit = handleUnitSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    if (editingUnit.value) {
      await store.updateCommunityUnit(editingUnit.value.id, formValues)
    } else {
      await store.createCommunityUnit(formValues)
    }
    showModal.value = false
    await loadUnits()
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to save unit'
  } finally {
    saving.value = false
  }
})

async function confirmDelete(unit) {
  if (!confirm(`Delete community unit "${unit.name}"? This cannot be undone.`)) return
  try {
    await store.deleteCommunityUnit(unit.id)
    await loadUnits()
  } catch (err) {
    console.error('Failed to delete unit:', err)
  }
}

async function viewCommittee(unit) {
  selectedUnit.value = unit
  await store.fetchCommitteeMembers(unit.id)
  showCommitteeModal.value = true
}

async function addCommitteeMember() {
  committeeSaving.value = true
  try {
    await store.addCommitteeMember(selectedUnit.value.id, committeeForm.value)
    committeeForm.value = {
      full_name: '',
      role: '',
      phone: '',
      email: '',
      elected_date: '',
      term_end_date: '',
      is_active: true,
    }
  } catch (err) {
    console.error('Failed to add committee member:', err)
  } finally {
    committeeSaving.value = false
  }
}

async function removeCommitteeMember(id) {
  if (!confirm('Remove this committee member?')) return
  try {
    await store.removeCommitteeMember(id)
  } catch (err) {
    console.error('Failed to remove committee member:', err)
  }
}

function goToPage(page) {
  store.communityUnitsPagination.page = page
  loadUnits()
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Community Health Units</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Unit
      </button>
    </div>

    <!-- Search -->
    <div class="form-control w-full max-w-xs">
      <div class="input-group">
        <input type="text" v-model="search" placeholder="Search units..." class="input input-bordered w-full" @keyup.enter="loadUnits" />
        <button class="btn btn-square" @click="loadUnits">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Units Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Ward</th>
            <th>Sub-County</th>
            <th>CHVs</th>
            <th>Households</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.communityUnits.length === 0">
            <td colspan="8" class="text-center text-base-content/60 py-8">No community units found.</td>
          </tr>
          <tr v-for="unit in store.communityUnits" :key="unit.id">
            <td class="font-medium">{{ unit.name }}</td>
            <td class="font-mono text-sm">{{ unit.code }}</td>
            <td>{{ unit.ward || '—' }}</td>
            <td>{{ unit.sub_county || '—' }}</td>
            <td>{{ unit.total_chvs || 0 }}</td>
            <td>{{ unit.total_households || 0 }}</td>
            <td>
              <span class="badge badge-sm" :class="unit.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ unit.status }}</span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="openEditModal(unit)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost" @click="viewCommittee(unit)" title="Committee">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(unit)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="store.communityUnitsPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.communityUnitsPagination.page <= 1" @click="goToPage(store.communityUnitsPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.communityUnitsPagination.totalPages" :key="p" :class="{'btn-active': p === store.communityUnitsPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.communityUnitsPagination.page >= store.communityUnitsPagination.totalPages" @click="goToPage(store.communityUnitsPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingUnit ? 'Edit' : 'New' }} Community Unit</h3>

        <div v-if="formError" class="alert alert-error mt-4 text-sm">{{ formError }}</div>

        <form @submit.prevent="onSaveUnit" class="space-y-4 mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="name" label="Unit Name *" placeholder="e.g. Kapenguria CHU" />
            <BaseInput name="code" label="Unit Code *" placeholder="e.g. CHU-001" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="ward" label="Ward" placeholder="e.g. Kanyarkwat" />
            <BaseInput name="sub_county" label="Sub-County" placeholder="e.g. Kapenguria" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="village" label="Village" placeholder="e.g. Chepareria" />
            <BaseSelect name="status" label="Status" :options="statusOptions" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="established_date" label="Established Date" type="date" />
            <BaseInput name="total_households" label="Total Households" type="number" />
          </div>
          <BaseInput name="total_chvs" label="Total CHVs" type="number" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false" :disabled="saving">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ editingUnit ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>

    <!-- Committee Members Modal -->
    <dialog :open="showCommitteeModal" class="modal" @click.self="showCommitteeModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">Committee Members — {{ selectedUnit?.name }}</h3>

        <!-- Existing members -->
        <div class="mt-4 space-y-2">
          <div v-if="store.committeeMembers.length === 0" class="text-sm text-base-content/60 text-center py-4">No committee members yet.</div>
          <div v-for="member in store.committeeMembers" :key="member.id" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <div>
              <div class="font-medium">{{ member.full_name }}</div>
              <div class="text-sm text-base-content/60">{{ member.role }} | {{ member.phone }}</div>
            </div>
            <button class="btn btn-xs btn-ghost text-error" @click="removeCommitteeMember(member.id)">✕</button>
          </div>
        </div>

        <div class="divider">Add Member</div>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text">Full Name</span></label>
              <input type="text" v-model="committeeForm.full_name" class="input input-bordered input-sm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Role</span></label>
              <input type="text" v-model="committeeForm.role" class="input input-bordered input-sm" placeholder="e.g. Chairperson" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text">Phone</span></label>
              <input type="tel" v-model="committeeForm.phone" class="input input-bordered input-sm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Email</span></label>
              <input type="email" v-model="committeeForm.email" class="input input-bordered input-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text">Elected Date</span></label>
              <input type="date" v-model="committeeForm.elected_date" class="input input-bordered input-sm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Term End</span></label>
              <input type="date" v-model="committeeForm.term_end_date" class="input input-bordered input-sm" />
            </div>
          </div>
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="committeeForm.is_active" class="checkbox checkbox-sm" />
            <span class="label-text">Active</span>
          </label>
          <button class="btn btn-primary btn-sm w-full" @click="addCommitteeMember" :disabled="committeeSaving">
            <span v-if="committeeSaving" class="loading loading-spinner loading-xs"></span>
            Add Member
          </button>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showCommitteeModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCommitteeModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
