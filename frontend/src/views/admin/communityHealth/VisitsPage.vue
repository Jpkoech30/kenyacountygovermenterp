<script setup>
/**
 * VisitsPage.vue
 * Record and manage household visits with referral tracking.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseTextarea from '../../../components/forms/BaseTextarea.vue'
import BaseCheckbox from '../../../components/forms/BaseCheckbox.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const selectedVisit = ref(null)

const schema = yup.object({
  household_id: yup.string().required('Household is required'),
  chv_id: yup.string().required('CHV is required'),
  visit_date: yup.string().required('Visit date is required'),
  visit_type: yup.string().required('Visit type is required'),
  household_condition: yup.string(),
  health_education_provided: yup.boolean(),
  health_education_topic: yup.string(),
  children_under_5_checked: yup.number().min(0).typeError('Must be a number'),
  pregnant_women_identified: yup.number().min(0).typeError('Must be a number'),
  referrals_made: yup.number().min(0).typeError('Must be a number'),
  referral_details: yup.string(),
  follow_up_required: yup.boolean(),
  follow_up_date: yup.string(),
  notes: yup.string(),
})

const { handleSubmit, isSubmitting, resetForm, values } = useFormValidation(schema, {
  household_id: '',
  chv_id: '',
  visit_date: new Date().toISOString().split('T')[0],
  visit_type: 'routine',
  household_condition: '',
  health_education_provided: false,
  health_education_topic: '',
  children_under_5_checked: 0,
  pregnant_women_identified: 0,
  referrals_made: 0,
  referral_details: '',
  follow_up_required: false,
  follow_up_date: '',
  notes: '',
})

const visitTypeOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'referral_follow_up', label: 'Referral Follow-up' },
]

onMounted(async () => {
  await Promise.all([
    loadVisits(),
    store.fetchHouseholds({ limit: 200 }),
    store.fetchVolunteers({ limit: 200 }),
  ])
})

async function loadVisits() {
  loading.value = true
  try {
    const params = { page: store.visitsPagination.page }
    await store.fetchVisits(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  resetForm({ values: {
    household_id: '',
    chv_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: 'routine',
    household_condition: '',
    health_education_provided: false,
    health_education_topic: '',
    children_under_5_checked: 0,
    pregnant_women_identified: 0,
    referrals_made: 0,
    referral_details: '',
    follow_up_required: false,
    follow_up_date: '',
    notes: '',
  } })
  showModal.value = true
}

function viewVisit(visit) {
  selectedVisit.value = visit
  showDetailModal.value = true
}

const onSubmit = handleSubmit(async (vals) => {
  try {
    await store.recordVisit(vals)
    showModal.value = false
    await loadVisits()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to record visit'
    resetForm({ errors: { visit_date: msg } })
  }
})

function goToPage(page) {
  store.visitsPagination.page = page
  loadVisits()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Household Visits</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Record Visit
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Date</th>
            <th>Household</th>
            <th>CHV</th>
            <th>Type</th>
            <th>Health Education</th>
            <th>Referrals</th>
            <th>Follow-up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.visits.length === 0">
            <td colspan="8" class="text-center text-base-content/60 py-8">No visits recorded.</td>
          </tr>
          <tr v-for="visit in store.visits" :key="visit.id">
            <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
            <td class="font-medium">{{ visit.household?.household_number || visit.household_id }}</td>
            <td>{{ visit.chv?.full_name || 'N/A' }}</td>
            <td><span class="badge badge-sm">{{ visit.visit_type }}</span></td>
            <td>
              <span v-if="visit.health_education_provided" class="badge badge-sm badge-success">Yes</span>
              <span v-else class="badge badge-sm badge-ghost">No</span>
            </td>
            <td>{{ visit.referrals_made || 0 }}</td>
            <td>
              <span v-if="visit.follow_up_required" class="badge badge-sm badge-warning">Required</span>
              <span v-else class="badge badge-sm badge-ghost">No</span>
            </td>
            <td>
              <button class="btn btn-xs btn-ghost" @click="viewVisit(visit)" title="View Details">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.visitsPagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="store.visitsPagination.page <= 1" @click="goToPage(store.visitsPagination.page - 1)">«</button>
        <button class="join-item btn btn-sm" v-for="p in store.visitsPagination.totalPages" :key="p" :class="{'btn-active': p === store.visitsPagination.page}" @click="goToPage(p)">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="store.visitsPagination.page >= store.visitsPagination.totalPages" @click="goToPage(store.visitsPagination.page + 1)">»</button>
      </div>
    </div>

    <!-- Record Visit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">Record Household Visit</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="household_id" label="Household" required :options="[{value:'',label:'Select household...'},...store.households.map(h=>({value:h.id,label:h.household_number+' - '+h.household_head}))]" />
            <BaseSelect name="chv_id" label="CHV" required :options="[{value:'',label:'Select CHV...'},...store.volunteers.map(v=>({value:v.id,label:v.full_name}))]" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="visit_date" label="Visit Date" type="date" required />
            <BaseSelect name="visit_type" label="Visit Type" :options="visitTypeOptions" />
          </div>

          <BaseTextarea name="household_condition" label="Household Condition" rows="2" />

          <div class="grid grid-cols-2 gap-4">
            <BaseCheckbox name="health_education_provided" label="Health Education Provided" />
            <BaseInput v-if="values.health_education_provided" name="health_education_topic" label="Topic" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="children_under_5_checked" label="Children Under 5 Checked" type="number" />
            <BaseInput name="pregnant_women_identified" label="Pregnant Women Identified" type="number" />
          </div>

          <BaseInput name="referrals_made" label="Referrals Made" type="number" />

          <BaseTextarea v-if="values.referrals_made > 0" name="referral_details" label="Referral Details (JSON)" rows="3" placeholder='[{"patient_id":1,"diagnosis":"Malaria","referred_to":"Kisumu County Hospital"}]' />

          <div class="grid grid-cols-2 gap-4">
            <BaseCheckbox name="follow_up_required" label="Follow-up Required" />
            <BaseInput v-if="values.follow_up_required" name="follow_up_date" label="Follow-up Date" type="date" />
          </div>

          <BaseTextarea name="notes" label="Notes" rows="2" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              Record Visit
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>

    <!-- Visit Detail Modal -->
    <dialog :open="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">Visit Details</h3>
        <div v-if="selectedVisit" class="space-y-3 mt-4">
          <div class="grid grid-cols-2 gap-2">
            <div><span class="font-semibold">Date:</span> {{ new Date(selectedVisit.visit_date).toLocaleDateString() }}</div>
            <div><span class="font-semibold">Type:</span> {{ selectedVisit.visit_type }}</div>
            <div><span class="font-semibold">Household:</span> {{ selectedVisit.household?.household_number }}</div>
            <div><span class="font-semibold">CHV:</span> {{ selectedVisit.chv?.full_name }}</div>
            <div><span class="font-semibold">Children Checked:</span> {{ selectedVisit.children_under_5_checked || 0 }}</div>
            <div><span class="font-semibold">Pregnant Identified:</span> {{ selectedVisit.pregnant_women_identified || 0 }}</div>
            <div><span class="font-semibold">Referrals:</span> {{ selectedVisit.referrals_made || 0 }}</div>
            <div><span class="font-semibold">Follow-up:</span> {{ selectedVisit.follow_up_required ? 'Yes' : 'No' }}</div>
          </div>
          <div v-if="selectedVisit.household_condition">
            <span class="font-semibold">Condition:</span>
            <p class="text-sm mt-1">{{ selectedVisit.household_condition }}</p>
          </div>
          <div v-if="selectedVisit.health_education_provided">
            <span class="font-semibold">Health Education:</span>
            <p class="text-sm mt-1">{{ selectedVisit.health_education_topic || 'Provided' }}</p>
          </div>
          <div v-if="selectedVisit.notes">
            <span class="font-semibold">Notes:</span>
            <p class="text-sm mt-1">{{ selectedVisit.notes }}</p>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showDetailModal = false">close</button></form>
    </dialog>
  </div>
</template>
