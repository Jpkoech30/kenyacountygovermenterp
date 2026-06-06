<script setup>
/**
 * ApplyPermitPage.vue
 * Public page for citizens to apply for a Single Business Permit.
 * Multi-step form with M-Pesa payment integration.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PermitForm from '../components/PermitForm.vue'
import { usePermitStore } from '../stores/permits'
import { useToast } from '../composables/useToast'

const { addToast } = useToast()

const router = useRouter()
const permitStore = usePermitStore()

const currentStep = ref('form') // form | payment | success
const permitResult = ref(null)
const paymentResult = ref(null)
const polling = ref(false)
const pollInterval = ref(null)

async function handleSubmit(formData) {
  try {
    const result = await permitStore.applyForPermit(formData)
    permitResult.value = result
    addToast('Application submitted! Proceed to payment.', 'success')
    currentStep.value = 'payment'
  } catch (err) {
    addToast(err.response?.data?.error || 'Failed to submit application. Please try again.', 'error')
  }
}

async function handlePay(phone) {
  if (!permitResult.value?.permit?.id) return

  try {
    const result = await permitStore.initiatePayment(permitResult.value.permit.id, phone)
    currentStep.value = 'success'
    paymentResult.value = { success: true, message: 'STK Push sent! Check your phone.' }
    addToast('STK Push sent to your phone. Please check and enter PIN.', 'success')

    // Start polling for payment status
    startPolling(permitResult.value.permit.id)
  } catch (err) {
    paymentResult.value = { success: false, message: err.response?.data?.error || 'Payment failed' }
    addToast(err.response?.data?.error || 'Payment failed. Please try again.', 'error')
  }
}

function startPolling(permitId) {
  polling.value = true
  pollInterval.value = setInterval(async () => {
    try {
      const status = await permitStore.checkStatus(permitId)
      if (status.status === 'paid') {
        clearInterval(pollInterval.value)
        polling.value = false
        paymentResult.value = { success: true, message: 'Payment confirmed! Your permit is being processed.' }
      } else if (status.status === 'pending_payment') {
        paymentResult.value = { success: true, message: 'Waiting for M-Pesa confirmation...' }
      }
    } catch (err) {
      // Continue polling
    }
  }, 5000)
}

function viewStatus() {
  if (permitResult.value?.permit?.id) {
    router.push(`/admin/permits/${permitResult.value.permit.id}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold">Single Business Permit Application</h1>
        <p class="text-gray-500 mt-2">West Pokot County Government</p>
      </div>

      <!-- Application Form -->
      <PermitForm
        v-if="currentStep === 'form'"
        @submit="handleSubmit"
        @pay="handlePay"
      />

      <!-- Payment Step (embedded in PermitForm) -->
      <div v-if="currentStep === 'payment'" class="card bg-base-100 shadow-xl max-w-lg mx-auto">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">Proceed to Payment</h2>
          <p class="text-gray-500">Permit ID: <strong>{{ permitResult?.permit?.permit_id }}</strong></p>
          <p class="text-gray-500">Amount: <strong>KES {{ parseFloat(permitResult?.permit?.fee_paid || 0).toLocaleString() }}</strong></p>
          <div class="divider"></div>
          <PermitForm @pay="handlePay" />
        </div>
      </div>

      <!-- Success -->
      <div v-if="currentStep === 'success'" class="card bg-base-100 shadow-xl max-w-lg mx-auto">
        <div class="card-body text-center space-y-4">
          <div v-if="paymentResult?.success" class="text-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 class="text-xl font-bold mt-4">Application Submitted!</h2>
            <p class="text-gray-500">{{ paymentResult.message }}</p>
          </div>
          <div v-else class="text-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 class="text-xl font-bold mt-4">Payment Failed</h2>
            <p class="text-gray-500">{{ paymentResult?.message }}</p>
          </div>

          <div v-if="polling" class="flex justify-center">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>

          <div class="flex gap-2 justify-center mt-4">
            <button class="btn btn-primary" @click="viewStatus">
              View Permit Status
            </button>
            <button class="btn btn-outline" @click="router.push('/')">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
