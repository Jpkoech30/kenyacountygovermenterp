<script setup>
/**
 * ChvVisitsPage.vue
 * CHV view to record and view their household visits.
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

const schema = yup.object({
  household_id: yup.string().required('Household is required'),
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
    store.fetchChvHouseholds(),
  ])
})

async function loadVisits() {
  loading.value = true
  try {
    await store.fetchChvVisits()
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  resetForm({ values: {
    household_id: '',
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">My Visits</h1>
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
            <th>Type</th>
            <th>Health Education</th>
            <th>Referrals</th>
            <th>Follow-up</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.chvVisits.length === 0">
            <td colspan="6" class="text-center text-base-content/60 py-8">No visits recorded.</td>
          </tr>
          <tr v-for="visit in store.chvVisits" :key="visit.id">
            <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
            <td class="font-medium">{{ visit.household?.household_number }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Record Visit Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">Record Visit</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect name="household_id" label="Household" required :options="[{value:'',label:'Select household...'},...store.chvHouseholds.map(h=>({value:h.id,label:h.household_number+' - '+h.household_head}))]" />
            <BaseInput name="visit_date" label="Visit Date" type="date" required />
          </div>

          <BaseSelect name="visit_type" label="Visit Type" :options="visitTypeOptions" />

          <BaseTextarea name="household_condition" label="Household Condition" rows="2" />

          <BaseCheckbox name="health_education_provided" label="Health Education Provided" />

          <BaseInput v-if="values.health_education_provided" name="health_education_topic" label="Topic" />

          <div class="grid grid-cols-2 gap-4">
            <BaseInput name="children_under_5_checked" label="Children Under 5 Checked" type="number" />
            <BaseInput name="pregnant_women_identified" label="Pregnant Women Identified" type="number" />
          </div>

          <BaseInput name="referrals_made" label="Referrals Made" type="number" />

          <BaseTextarea v-if="values.referrals_made > 0" name="referral_details" label="Referral Details (JSON)" rows="2" placeholder='[{"patient_id":1,"diagnosis":"Malaria","referred_to":"Kisumu County Hospital"}]' />

          <BaseCheckbox name="follow_up_required" label="Follow-up Required" />

          <BaseInput v-if="values.follow_up_required" name="follow_up_date" label="Follow-up Date" type="date" />

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
  </div>
</template>
