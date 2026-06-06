<script setup>
/**
 * PatientRegistrationForm.vue
 * Multi-step form with vee-validate + Yup validation for registering new patients.
 * Refactored to use BaseInput, BaseSelect, BaseRadioGroup components.
 */
import { ref } from 'vue'
import { useHealthStore } from '../../stores/health'
import * as yup from 'yup'
import { useFormValidation } from '../../composables/useFormValidation'
import BaseInput from '../forms/BaseInput.vue'
import BaseSelect from '../forms/BaseSelect.vue'
import BaseRadioGroup from '../forms/BaseRadioGroup.vue'

const emit = defineEmits(['saved', 'cancel'])
const healthStore = useHealthStore()

const step = ref(1)
const saving = ref(false)
const formError = ref('')

// Yup validation schema
const schema = yup.object({
  national_id: yup
    .string()
    .matches(/^\d{8}$/, 'National ID must be exactly 8 digits')
    .required('National ID is required'),
  first_name: yup.string().trim().required('First name is required'),
  last_name: yup.string().trim().required('Last name is required'),
  date_of_birth: yup.date().required('Date of birth is required').max(new Date(), 'Date of birth cannot be in the future'),
  gender: yup.string().oneOf(['male', 'female', 'other'], 'Select a valid gender').required('Gender is required'),
  phone: yup
    .string()
    .matches(/^(07|01)\d{8}$/, 'Phone must be a valid Kenyan number (e.g. 0712345678)')
    .required('Phone number is required'),
  email: yup.string().email('Invalid email format'),
  village: yup.string(),
  sub_location_id: yup.string(),
  mother_national_id: yup.string().matches(/^\d{8}$/, 'Must be exactly 8 digits'),
  father_national_id: yup.string().matches(/^\d{8}$/, 'Must be exactly 8 digits'),
})

const { handleSubmit, isSubmitting, resetForm, errors, values } = useFormValidation(schema, {
  national_id: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  village: '',
  sub_location_id: '',
  mother_national_id: '',
  father_national_id: '',
})

function nextStep() {
  // Validate only the fields for the current step
  if (step.value === 1) {
    // Trigger validation on step 1 fields
    const step1Fields = ['national_id', 'first_name', 'last_name', 'date_of_birth', 'gender']
    const hasErrors = step1Fields.some((field) => errors.value[field])
    if (!hasErrors && values.value.national_id && values.value.first_name && values.value.last_name && values.value.date_of_birth && values.value.gender) {
      step.value = 2
    }
  } else if (step.value === 2) {
    const step2Fields = ['phone', 'email', 'mother_national_id', 'father_national_id']
    const hasErrors = step2Fields.some((field) => errors.value[field])
    if (!hasErrors && values.value.phone) {
      step.value = 3
    }
  }
}

function prevStep() {
  if (step.value > 1) step.value--
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const onSubmit = handleSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    await healthStore.registerPatient({ ...formValues })
    emit('saved')
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to register patient'
  } finally {
    saving.value = false
  }
})
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Register New Patient</h2>

      <!-- Steps indicator -->
      <ul class="steps steps-horizontal w-full mb-6">
        <li class="step" :class="{ 'step-primary': step >= 1 }">Personal Info</li>
        <li class="step" :class="{ 'step-primary': step >= 2 }">Contact & Family</li>
        <li class="step" :class="{ 'step-primary': step >= 3 }">Review</li>
      </ul>

      <!-- Error alert -->
      <div v-if="formError" role="alert" class="alert alert-error mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ formError }}</span>
      </div>

      <!-- Step 1: Personal Info -->
      <div v-if="step === 1" class="space-y-4">
        <BaseInput
          name="national_id"
          label="National ID"
          type="text"
          placeholder="e.g. 12345678"
          hint="Kenyan national ID must be exactly 8 digits"
          required
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            name="first_name"
            label="First Name"
            type="text"
            placeholder="First name"
            required
          />
          <BaseInput
            name="last_name"
            label="Last Name"
            type="text"
            placeholder="Last name"
            required
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            name="date_of_birth"
            label="Date of Birth"
            type="date"
            required
          />
          <BaseRadioGroup
            name="gender"
            label="Gender"
            :options="genderOptions"
            required
          />
        </div>
      </div>

      <!-- Step 2: Contact & Family -->
      <div v-if="step === 2" class="space-y-4">
        <BaseInput
          name="phone"
          label="Phone"
          type="tel"
          placeholder="e.g. 0712345678"
          hint="Kenyan number starting with 07 or 01"
          required
        />
        <BaseInput
          name="email"
          label="Email"
          type="email"
          placeholder="patient@example.com"
        />
        <BaseInput
          name="village"
          label="Village"
          type="text"
          placeholder="Village name"
        />
        <BaseInput
          name="sub_location_id"
          label="Sub-location ID"
          type="text"
          placeholder="Optional"
        />

        <!-- Family Information -->
        <div class="divider">Family Information (Optional)</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            name="mother_national_id"
            label="Mother's National ID"
            type="text"
            placeholder="e.g. 12345678"
            hint="Required for patients under 18 years old"
          />
          <BaseInput
            name="father_national_id"
            label="Father's National ID"
            type="text"
            placeholder="e.g. 87654321"
            hint="Required for patients under 18 years old"
          />
        </div>
      </div>

      <!-- Step 3: Review -->
      <div v-if="step === 3" class="space-y-4">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <tbody>
              <tr><td class="font-semibold">National ID</td><td>{{ values.national_id }}</td></tr>
              <tr><td class="font-semibold">Name</td><td>{{ values.first_name }} {{ values.last_name }}</td></tr>
              <tr><td class="font-semibold">Date of Birth</td><td>{{ values.date_of_birth }}</td></tr>
              <tr><td class="font-semibold">Gender</td><td class="capitalize">{{ values.gender }}</td></tr>
              <tr><td class="font-semibold">Phone</td><td>{{ values.phone }}</td></tr>
              <tr><td class="font-semibold">Email</td><td>{{ values.email || '&mdash;' }}</td></tr>
              <tr><td class="font-semibold">Village</td><td>{{ values.village || '&mdash;' }}</td></tr>
              <tr><td class="font-semibold">Mother's National ID</td><td>{{ values.mother_national_id || '&mdash;' }}</td></tr>
              <tr><td class="font-semibold">Father's National ID</td><td>{{ values.father_national_id || '&mdash;' }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions justify-between mt-6">
        <div>
          <button v-if="step > 1" class="btn btn-ghost" @click="prevStep" :disabled="saving">
            Previous
          </button>
        </div>
        <div class="space-x-2">
          <button class="btn" @click="$emit('cancel')" :disabled="saving">Cancel</button>
          <button v-if="step < 3" class="btn btn-primary" @click="nextStep">Next</button>
          <button v-else class="btn btn-primary" @click="onSubmit" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            {{ saving ? 'Saving...' : 'Register Patient' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
