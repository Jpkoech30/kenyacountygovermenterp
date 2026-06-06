<script setup>
/**
 * PermitForm.vue
 * Multi-step form for Single Business Permit application.
 * Steps: Business Details → Location → Summary → Payment
 * Uses vee-validate + Yup validation with base form components.
 */
import { ref, computed } from 'vue'
import * as yup from 'yup'
import { useFormValidation } from '../composables/useFormValidation'
import BaseInput from './forms/BaseInput.vue'
import BaseSelect from './forms/BaseSelect.vue'

const emit = defineEmits(['submit', 'pay'])

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
const currentStep = ref(1)
const totalSteps = 4
const submitting = ref(false)
const paymentInitiated = ref(false)
const paymentResult = ref(null)
const permitResult = ref(null)
const pollInterval = ref(null)

// ---------------------------------------------------------------------------
// Validation Schema (per-step)
// ---------------------------------------------------------------------------
const step1Schema = yup.object({
  business_name: yup.string().required('Business name is required').min(2, 'Business name must be at least 2 characters'),
  kra_pin: yup.string().required('KRA PIN is required').matches(/^P\d{9}[A-Z]$/i, 'KRA PIN must be in format P051234567Z'),
  business_activity: yup.string().required('Business activity is required'),
  activity_code: yup.string(),
  employee_size: yup.number().min(1, 'Must have at least 1 employee').typeError('Must be a number'),
  phone: yup.string().required('Phone number is required').matches(/^(07|01)\d{8}$/, 'Phone must start with 07 or 01 and be 10 digits'),
  email: yup.string().email('Invalid email format'),
})

const step2Schema = yup.object({
  sub_county: yup.string().required('Sub-county is required'),
  ward: yup.string(),
  plot_no: yup.string(),
  road_street: yup.string(),
  building: yup.string(),
  floor: yup.string(),
  door_stall_no: yup.string(),
})

// Combined schema for all fields (used for summary display)
const fullSchema = step1Schema.concat(step2Schema)

const { handleSubmit, isSubmitting, resetForm, errors, values, validateField, setFieldValue } = useFormValidation(fullSchema, {
  business_name: '',
  kra_pin: '',
  business_activity: '',
  activity_code: '',
  employee_size: 1,
  phone: '',
  email: '',
  sub_county: '',
  ward: '',
  plot_no: '',
  road_street: '',
  building: '',
  floor: '',
  door_stall_no: '',
})

// ---------------------------------------------------------------------------
// Step validation
// ---------------------------------------------------------------------------
const stepErrors = computed(() => {
  const errs = {}
  if (currentStep.value === 1) {
    if (!values.business_name) errs.business_name = 'Business name is required'
    if (!values.kra_pin) errs.kra_pin = 'KRA PIN is required'
    if (!values.business_activity) errs.business_activity = 'Business activity is required'
    if (!values.phone) errs.phone = 'Phone number is required'
  }
  if (currentStep.value === 2) {
    if (!values.sub_county) errs.sub_county = 'Sub-county is required'
  }
  return errs
})

const canProceed = computed(() => Object.keys(stepErrors.value).length === 0)

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function nextStep() {
  if (canProceed.value && currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------
const onSubmit = handleSubmit(async (formValues) => {
  submitting.value = true
  try {
    emit('submit', { ...formValues })
  } finally {
    submitting.value = false
  }
})

async function handlePay() {
  submitting.value = true
  try {
    emit('pay', values.phone)
  } finally {
    submitting.value = false
  }
}

// ---------------------------------------------------------------------------
// Step titles
// ---------------------------------------------------------------------------
const stepTitles = ['Business Details', 'Location', 'Summary', 'Payment']

const subCountyOptions = [
  { value: '', label: 'Select Sub-County' },
  { value: 'Kapenguria', label: 'Kapenguria' },
  { value: 'Pokot South', label: 'Pokot South' },
  { value: 'Pokot North', label: 'Pokot North' },
  { value: 'Pokot Central', label: 'Pokot Central' },
  { value: 'Kipkomo', label: 'Kipkomo' },
]
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">
    <!-- Progress Steps -->
    <div class="flex justify-center mb-8">
      <ul class="steps steps-horizontal">
        <li
          v-for="(title, index) in stepTitles"
          :key="index"
          :class="[
            'step',
            { 'step-primary': index + 1 <= currentStep },
          ]"
        >
          {{ title }}
        </li>
      </ul>
    </div>

    <!-- Step 1: Business Details -->
    <div v-if="currentStep === 1" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-xl mb-4">Business Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <BaseInput
              name="business_name"
              label="Business Name *"
              placeholder="e.g., West Pokot General Store"
            />
          </div>
          <BaseInput
            name="kra_pin"
            label="KRA PIN *"
            placeholder="e.g., P051234567Z"
          />
          <BaseInput
            name="phone"
            label="Phone Number *"
            type="tel"
            placeholder="e.g., 0712345678"
          />
          <div class="md:col-span-2">
            <BaseInput
              name="business_activity"
              label="Business Activity *"
              placeholder="e.g., Retail Trade - General Merchandise"
            />
          </div>
          <BaseInput
            name="activity_code"
            label="Activity Code"
            placeholder="e.g., 47110"
          />
          <BaseInput
            name="employee_size"
            label="Number of Employees"
            type="number"
          />
          <div class="md:col-span-2">
            <BaseInput
              name="email"
              label="Email (optional)"
              type="email"
              placeholder="e.g., owner@example.com"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Location -->
    <div v-if="currentStep === 2" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-xl mb-4">Business Location</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            name="sub_county"
            label="Sub-County *"
            :options="subCountyOptions"
          />
          <BaseInput
            name="ward"
            label="Ward"
            placeholder="e.g., Kanyarkwat"
          />
          <BaseInput
            name="plot_no"
            label="Plot Number"
            placeholder="e.g., KPG/1234"
          />
          <BaseInput
            name="road_street"
            label="Road/Street"
            placeholder="e.g., Makutano Road"
          />
          <BaseInput
            name="building"
            label="Building"
            placeholder="e.g., County Plaza"
          />
          <BaseInput
            name="floor"
            label="Floor"
            placeholder="e.g., Ground Floor"
          />
          <BaseInput
            name="door_stall_no"
            label="Door/Stall No."
            placeholder="e.g., Shop 5"
          />
        </div>
      </div>
    </div>

    <!-- Step 3: Summary -->
    <div v-if="currentStep === 3" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-xl mb-4">Application Summary</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <tbody>
              <tr><td class="font-semibold">Business Name</td><td>{{ values.business_name }}</td></tr>
              <tr><td class="font-semibold">KRA PIN</td><td>{{ values.kra_pin }}</td></tr>
              <tr><td class="font-semibold">Business Activity</td><td>{{ values.business_activity }}</td></tr>
              <tr><td class="font-semibold">Activity Code</td><td>{{ values.activity_code || 'N/A' }}</td></tr>
              <tr><td class="font-semibold">Employees</td><td>{{ values.employee_size }}</td></tr>
              <tr><td class="font-semibold">Phone</td><td>{{ values.phone }}</td></tr>
              <tr><td class="font-semibold">Email</td><td>{{ values.email || 'N/A' }}</td></tr>
              <tr><td class="font-semibold">Sub-County</td><td>{{ values.sub_county }}</td></tr>
              <tr><td class="font-semibold">Ward</td><td>{{ values.ward || 'N/A' }}</td></tr>
              <tr><td class="font-semibold">Location</td><td>{{ [values.plot_no, values.road_street, values.building, values.floor, values.door_stall_no].filter(Boolean).join(', ') || 'N/A' }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="alert alert-info mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Permit fee is <strong>KES 1,000</strong>. You will be redirected to M-Pesa for payment.</span>
        </div>
      </div>
    </div>

    <!-- Step 4: Payment -->
    <div v-if="currentStep === 4" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-xl mb-4">Payment</h2>

        <div v-if="!paymentInitiated" class="space-y-4">
          <div class="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Application submitted successfully!</span>
          </div>

          <BaseInput
            name="phone"
            label="M-Pesa Phone Number"
            type="tel"
            placeholder="e.g., 0712345678"
          />

          <button
            type="button"
            class="btn btn-primary w-full"
            :disabled="submitting"
            @click="handlePay"
          >
            <span v-if="submitting" class="loading loading-spinner"></span>
            Pay KES 1,000 via M-Pesa
          </button>
        </div>

        <div v-else class="text-center space-y-4">
          <div class="animate-pulse">
            <div class="loading loading-spinner loading-lg text-primary"></div>
          </div>
          <p class="text-lg font-semibold">STK Push sent to {{ values.phone }}</p>
          <p>Please check your phone and enter your M-Pesa PIN to complete payment.</p>
          <p class="text-sm text-gray-500">Waiting for payment confirmation...</p>

          <div v-if="paymentResult" class="alert" :class="paymentResult.success ? 'alert-success' : 'alert-error'">
            <span>{{ paymentResult.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-6" v-if="currentStep < 4">
      <button type="button" class="btn btn-outline" :disabled="currentStep === 1" @click="prevStep">
        ← Previous
      </button>
      <button type="button" class="btn btn-primary" :disabled="!canProceed" @click="nextStep">
        Next →
      </button>
    </div>

    <div class="flex justify-center mt-6" v-if="currentStep === 3">
      <button type="button" class="btn btn-primary btn-lg" :disabled="submitting" @click="onSubmit">
        <span v-if="submitting" class="loading loading-spinner"></span>
        Submit Application
      </button>
    </div>
  </div>
</template>
