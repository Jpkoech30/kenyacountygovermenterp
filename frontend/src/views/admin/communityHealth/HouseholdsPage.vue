<script setup>
/**
 * HouseholdsPage.vue
 * Manage households - list, create, edit, delete, and manage household members.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseCheckbox from '../../../components/forms/BaseCheckbox.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const editingHousehold = ref(null)
const selectedHousehold = ref(null)
const search = ref('')

const schema = yup.object({
  community_unit_id: yup.string(),
  chv_id: yup.string(),
  household_head: yup.string().required('Household head is required'),
  village: yup.string(),
  sub_location: yup.string(),
  latitude: yup.string(),
  longitude: yup.string(),
  family_size: yup.number().min(1, 'Minimum 1').typeError('Must be a number'),
  number_of_rooms: yup.number().min(1, 'Minimum 1').typeError('Must be a number'),
  has_electricity: yup.boolean(),
  has_improved_sanitation: yup.boolean(),
  main_water_source: yup.string(),
  status: yup.string().required('Status is required'),
})

const { handleSubmit, isSubmitting, resetForm, setFieldValue, values } = useFormValidation(schema, {
  community_unit_id: '',
  chv_id: '',
  household_head: '',
  village: '',
  sub_location: '',
  latitude: '',
  longitude: '',
  family_size: 1,
  number_of_rooms: 1,
  has_electricity: false,
  has_improved_sanitation: false,
  main_water_source: '',
  status: 'active',
})

const waterSourceOptions = [
  { value: '', label: 'Select...' },
  { value: 'piped', label: 'Piped Water' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'well', label: 'Protected Well' },
  { value: 'spring', label: 'Protected Spring' },
  { value: 'rainwater', label: 'Rainwater Harvesting' },
  { value: 'river', label: 'River/Stream' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
]

// Member form (simple, not using vee-validate)
const memberForm = ref({
  full_name: '',
  national_id: '',
  date_of_birth: '',
  gender: 'male',
  relationship_to_head: '',
  is_head: false,
  education_level: '',
  occupation: '',
  is_pregnant: false,
  has_chronic_illness: false,
  chronic_illness_notes: '',
  is_disabled: false,
  disability_type: '',
})

const memberSaving = ref(false)

onMounted(async () => {
  await Promise.all([
    loadHouseholds(),
    store.fetchCommunityUnits({ limit: 200 }),
    store.fetchVolunteers({ limit: 200 }),
  ])
})

async function loadHouseholds() {
  loading.value = true
  try {
    const params = { page: store.householdsPagination.page }
    if (search.value) params.search = search.value
    await store.fetchHouseholds(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingHousehold.value = null
  resetForm({ values: { community_unit_id: '', chv_id: '', household_head: '', village: '', sub_location: '', latitude: '', longitude: '', family_size: 1, number_of_rooms: 1, has_electricity: false, has_improved_sanitation: false, main_water_source: '', status: 'active' } })
  showModal.value = true
}

function openEditModal(household) {
  editingHousehold.value = household
  resetForm({ values: {
    community_unit_id: household.community_unit_id || '',
    chv_id: household.chv_id || '',
    household_head: household.household_head,
    village: household.village || '',
    sub_location: household.sub_location || '',
    latitude: household.latitude || '',
    longitude: household.longitude || '',
    family_size: household.family_size || 1,
    number_of_rooms: household.number_of_rooms || 1,
    has_electricity: household.has_electricity || false,
    has_improved_sanitation: household.has_improved_sanitation || false,
    main_water_source: household.main_water_source || '',
    status: household.status,
  } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (vals) => {
  try {
    if (editingHousehold.value) {
      await store.updateHousehold(editingHousehold.value.id, vals)
    } else {
      await store.createHousehold(vals)
    }
    showModal.value = false
    await loadHouseholds()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save household'
    resetForm({ errors: { household_head: msg } })
  }
})

async function confirmDelete(household) {
  if (!confirm(`Delete household "${household.household_number}"?`)) return
  try {
    await store.deleteHousehold(household.id)
    await loadHouseholds()
  } catch (err) {
    console.error('Failed to delete household:', err)
  }
}

async function viewHousehold(household) {
  selectedHousehold.value = household
  await store.fetchHousehold(household.id)
  await store.fetchHouseholdMembers(household.id)
  showDetailModal.value = true
}

async function addMember() {
  memberSaving.value = true
  try {
    await store.addHouseholdMember(selectedHousehold.value.id, memberForm.value)
    memberForm.value = { full_name: '', national_id: '', date_of_birth: '', gender: 'male', relationship_to_head: '', is_head: false, education_level: '', occupation: '', is_pregnant: false, has_chronic_illness: false, chronic_illness_notes: '', is_disabled: false, disability_type: '' }
    await store.fetchHouseholdMembers(selectedHousehold.value.id)
  } catch (err) {
    console.error('Failed to add member:', err)
  } finally {
    memberSaving.value = false
  }
}

async function removeMember(id) {
  if (!confirm('Remove this household member?')) return
  try {
    await store.removeHouseholdMember(id)
    await store.fetchHouseholdMembers(selectedHousehold.value.id)
  } catch (err) {
    console.error('Failed to remove member:', err)
  }
}

function goToPage(page) {
  store.householdsPagination.page = page
  loadHouseholds()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Households</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Household
      </button>
    </div>

    <div class="form-control w-full max-w-xs">
      <div class="input-group">
        <input type="text" v-model="search" placeholder="Search households..." class="input input-bordered w-full" @keyup.enter="loadHouseholds" />
        <button class="btn btn-square" @click="loadHouseholds">
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
            <th>HH Number</th>
            <th>Head</th>
            <th>Village</th>
            <th>Unit</th>
            <th>CHV</th>
            <th>Family Size</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.households.length === 0">
            <td colspan="8" class="text-center text-base-content/60 py-8">No households found.</td>
          </tr>
          <tr v-for="hh in store.households" :key="hh.id">
            <td class="font-medium"><code class="text-xs">{{ hh.household_number }}</code></td>
            <td>{{ hh.household_head }}</td>
            <td>{{ hh.village }}</td>
            <td>{{ hh.community_unit?.code || hh.community_unit_id }}</td>
            <td>{{ hh.chv?.full_name || 'N/A' }}</td>
            <td>{{ hh.family_size || 0 }}</td>
            <td>
              <span class="badge badge-sm" :class="hh.status === 'active' ? 'badge-success' : hh.status === 'closed' ? 'badge-error' : 'badge-ghost'">
                {{ hh.status }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-xs btn-ghost" @click="viewHousehold(hh)" title="View Details">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost" @click="openEditModal(hh)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-xs btn-ghost text-error" @click="confirmDelete(hh)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.householdsPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.householdsPagination.page <= 1" @click="goToPage(store.householdsPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.householdsPagination.totalPages" :key="p" :class="{'btn-active': p === store.householdsPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.householdsPagination.page >= store.householdsPagination.totalPages" @click="goToPage(store.householdsPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingHousehold ? 'Edit' : 'New' }} Household</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseInput name="household_head" label="Household Head" required placeholder="Enter head's name" />

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="community_unit_id" label="Community Unit" :options="[{value:'',label:'Select unit...'},...store.communityUnits.map(u=>({value:u.id,label:u.name+' ('+u.code+')'}))]" />
            <BaseSelect name="chv_id" label="Assigned CHV" :options="[{value:'',label:'Select CHV...'},...store.volunteers.map(v=>({value:v.id,label:v.full_name}))]" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="village" label="Village" placeholder="Enter village name" />
            <BaseInput name="sub_location" label="Sub-Location" placeholder="Enter sub-location" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="latitude" label="Latitude" placeholder="e.g., -1.2921" />
            <BaseInput name="longitude" label="Longitude" placeholder="e.g., 36.8219" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="family_size" label="Family Size" type="number" />
            <BaseInput name="number_of_rooms" label="Number of Rooms" type="number" />
          </div>

          <BaseSelect name="main_water_source" label="Main Water Source" :options="waterSourceOptions" />

          <div class="grid grid-cols-2 gap-4">
            <BaseCheckbox name="has_electricity" label="Has Electricity" />
            <BaseCheckbox name="has_improved_sanitation" label="Improved Sanitation" />
          </div>

          <BaseSelect name="status" label="Status" :options="statusOptions" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingHousehold ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>

    <!-- Detail Modal -->
    <dialog :open="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg">Household {{ store.currentHousehold?.household_number }}</h3>

        <div v-if="store.currentHousehold" class="grid grid-cols-2 gap-4 mt-4">
          <div><span class="font-semibold">Head:</span> {{ store.currentHousehold.household_head }}</div>
          <div><span class="font-semibold">Village:</span> {{ store.currentHousehold.village }}</div>
          <div><span class="font-semibold">Sub-Location:</span> {{ store.currentHousehold.sub_location }}</div>
          <div><span class="font-semibold">Family Size:</span> {{ store.currentHousehold.family_size }}</div>
          <div><span class="font-semibold">Electricity:</span> {{ store.currentHousehold.has_electricity ? 'Yes' : 'No' }}</div>
          <div><span class="font-semibold">Sanitation:</span> {{ store.currentHousehold.has_improved_sanitation ? 'Improved' : 'Basic' }}</div>
          <div><span class="font-semibold">Water Source:</span> {{ store.currentHousehold.main_water_source || 'N/A' }}</div>
          <div><span class="font-semibold">Status:</span> {{ store.currentHousehold.status }}</div>
        </div>

        <div class="divider"></div>
        <h4 class="font-semibold mb-2">Household Members</h4>

        <!-- Add member form -->
        <div class="grid grid-cols-3 gap-2 p-3 bg-base-200 rounded-lg mb-4">
          <input type="text" v-model="memberForm.full_name" placeholder="Full name" class="input input-bordered input-sm" />
          <input type="text" v-model="memberForm.national_id" placeholder="National ID" class="input input-bordered input-sm" />
          <select v-model="memberForm.gender" class="select select-bordered select-sm">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input type="date" v-model="memberForm.date_of_birth" class="input input-bordered input-sm" />
          <input type="text" v-model="memberForm.relationship_to_head" placeholder="Relationship" class="input input-bordered input-sm" />
          <button class="btn btn-primary btn-sm" @click="addMember" :disabled="memberSaving">
            <span v-if="memberSaving" class="loading loading-spinner loading-xs"></span>
            Add Member
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>National ID</th>
                <th>Gender</th>
                <th>Relationship</th>
                <th>Age</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.householdMembers.length === 0">
                <td colspan="6" class="text-center text-base-content/60">No members added.</td>
              </tr>
              <tr v-for="member in store.householdMembers" :key="member.id">
                <td>{{ member.full_name }} <span v-if="member.is_head" class="badge badge-xs badge-primary">Head</span></td>
                <td>{{ member.national_id || '-' }}</td>
                <td>{{ member.gender }}</td>
                <td>{{ member.relationship_to_head }}</td>
                <td>{{ member.date_of_birth ? new Date().getFullYear() - new Date(member.date_of_birth).getFullYear() : '-' }}</td>
                <td>
                  <button class="btn btn-xs btn-ghost text-error" @click="removeMember(member.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showDetailModal = false">close</button></form>
    </dialog>
  </div>
</template>
