<script setup>
/**
 * VisitForm.vue
 * Quick form for health workers to record a patient visit.
 * Includes patient search, diagnosis, treatment, and referral fields.
 * Uses vee-validate + Yup validation with base form components.
 */
import { ref, computed } from 'vue'
import * as yup from 'yup'
import { useHealthStore } from '../../stores/health'
import { useFormValidation } from '../../composables/useFormValidation'
import BaseInput from '../forms/BaseInput.vue'
import BaseSelect from '../forms/BaseSelect.vue'
import BaseTextarea from '../forms/BaseTextarea.vue'

const emit = defineEmits(['saved', 'cancel'])
const healthStore = useHealthStore()

const saving = ref(false)
const searching = ref(false)
const formError = ref('')
const patientSearch = ref('')
const searchResults = ref([])
const showSearch = ref(false)

const selectedPatient = ref(null)

const schema = yup.object({
  patient_id: yup.number().required('Please select a patient').typeError('Please select a patient'),
  visit_date: yup.string().required('Visit date is required'),
  facility_type: yup.string().required('Facility type is required'),
  diagnosis: yup.string().required('Diagnosis is required').min(3, 'Diagnosis must be at least 3 characters'),
  treatment: yup.string(),
  referred_to: yup.string(),
  referred_date: yup.string(),
  notes: yup.string(),
})

const { handleSubmit, isSubmitting, resetForm, errors, values, setFieldValue } = useFormValidation(schema, {
  patient_id: null,
  visit_date: new Date().toISOString().slice(0, 16),
  facility_type: 'outpatient',
  diagnosis: '',
  treatment: '',
  referred_to: '',
  referred_date: '',
  notes: '',
})

async function searchPatient() {
  if (!patientSearch.value.trim()) return
  searching.value = true
  try {
    const data = await healthStore.fetchPatients({ search: patientSearch.value, limit: 10 })
    searchResults.value = data.patients || []
    showSearch.value = true
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function selectPatient(patient) {
  selectedPatient.value = patient
  setFieldValue('patient_id', patient.id)
  showSearch.value = false
  patientSearch.value = ''
}

function clearPatient() {
  selectedPatient.value = null
  setFieldValue('patient_id', null)
}

const patientDisplay = computed(() => {
  if (!selectedPatient.value) return ''
  return `${selectedPatient.value.first_name} ${selectedPatient.value.last_name} (${selectedPatient.value.national_id})`
})

const onSubmit = handleSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      patient_id: formValues.patient_id,
      visit_date: formValues.visit_date,
      facility_type: formValues.facility_type,
      diagnosis: formValues.diagnosis,
      treatment: formValues.treatment,
      notes: formValues.notes,
    }
    if (formValues.referred_to) payload.referred_to = formValues.referred_to
    if (formValues.referred_date) payload.referred_date = formValues.referred_date

    await healthStore.recordVisit(payload)
    emit('saved')
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to record visit'
  } finally {
    saving.value = false
  }
})

const facilityTypeOptions = [
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'emergency', label: 'Emergency' },
]
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Record Patient Visit</h2>

      <!-- Error alert -->
      <div v-if="formError" role="alert" class="alert alert-error mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ formError }}</span>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <!-- Patient Search -->
        <div class="form-control">
          <label class="label"><span class="label-text">Patient *</span></label>
          <div v-if="!selectedPatient" class="join w-full">
            <input
              v-model="patientSearch"
              type="text"
              placeholder="Search by name or national ID..."
              class="input input-bordered join-item flex-1"
              @keyup.enter="searchPatient"
            />
            <button type="button" class="btn btn-primary join-item" @click="searchPatient" :disabled="searching">
              <span v-if="searching" class="loading loading-spinner loading-xs"></span>
              Search
            </button>
          </div>
          <div v-else class="badge badge-info badge-lg gap-2 p-3">
            {{ patientDisplay }}
            <button type="button" class="btn btn-ghost btn-xs" @click="clearPatient">✕</button>
          </div>
          <label v-if="errors.patient_id" class="label" for="patient_id-error">
            <span id="patient_id-error" class="label-text-alt text-error" aria-live="assertive">{{ errors.patient_id }}</span>
          </label>

          <!-- Search results dropdown -->
          <div v-if="showSearch && searchResults.length > 0" class="mt-2 border rounded-lg shadow bg-base-100 max-h-48 overflow-y-auto">
            <div
              v-for="p in searchResults"
              :key="p.id"
              class="p-3 hover:bg-base-200 cursor-pointer border-b"
              @click="selectPatient(p)"
            >
              <div class="font-medium">{{ p.first_name }} {{ p.last_name }}</div>
              <div class="text-sm text-base-content/60">ID: {{ p.national_id }} | {{ p.phone }}</div>
            </div>
          </div>
          <div v-else-if="showSearch && !searching" class="mt-2 text-sm text-base-content/60">No patients found</div>
        </div>

        <!-- Visit Date -->
        <BaseInput
          name="visit_date"
          label="Visit Date & Time"
          type="datetime-local"
        />

        <!-- Facility Type -->
        <BaseSelect
          name="facility_type"
          label="Facility Type"
          :options="facilityTypeOptions"
        />

        <!-- Diagnosis -->
        <BaseTextarea
          name="diagnosis"
          label="Diagnosis *"
          placeholder="Enter diagnosis details..."
          :rows="3"
        />

        <!-- Treatment -->
        <BaseTextarea
          name="treatment"
          label="Treatment / Prescription"
          placeholder="Enter treatment or prescription..."
          :rows="3"
        />

        <!-- Referral -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            name="referred_to"
            label="Referred To"
            placeholder="e.g. County Hospital"
          />
          <BaseInput
            name="referred_date"
            label="Referral Date"
            type="date"
          />
        </div>

        <!-- Notes -->
        <BaseTextarea
          name="notes"
          label="Additional Notes"
          placeholder="Any additional notes..."
          :rows="2"
        />

        <!-- Actions -->
        <div class="card-actions justify-end mt-6">
          <button type="button" class="btn" @click="$emit('cancel')" :disabled="saving">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            {{ saving ? 'Saving...' : 'Record Visit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
