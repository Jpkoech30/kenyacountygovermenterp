<script setup>
/**
 * VerifyPermitPage.vue
 * Public verification page for business permits.
 * Accessible at /verify/:permit_id
 * Shows permit details and QR code if the permit is active.
 */
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '../api/axios'
import QRCodeDisplay from '../components/QRCodeDisplay.vue'

const route = useRoute()

const permit = ref(null)
const loading = ref(true)
const error = ref(null)
const valid = ref(false)

async function verifyPermit() {
  loading.value = true
  error.value = null
  try {
    const response = await apiClient.get(`/verify/${route.params.permit_id}`)
    permit.value = response.data
    valid.value = response.data.valid
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to verify permit'
    permit.value = err.response?.data
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatCurrency(amount) {
  return `KES ${parseFloat(amount || 0).toLocaleString()}`
}

onMounted(verifyPermit)
</script>

<template>
  <div class="min-h-screen bg-base-200 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Error / Not Found -->
      <div v-else-if="error" class="card bg-base-100 shadow-xl">
        <div class="card-body text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 class="text-2xl font-bold mt-4">Permit Not Found</h2>
          <p class="text-gray-500 mt-2">{{ error }}</p>
          <p class="text-sm text-gray-400 mt-1">Permit ID: {{ route.params.permit_id }}</p>
        </div>
      </div>

      <!-- Invalid / Not Active -->
      <div v-else-if="!valid" class="card bg-base-100 shadow-xl">
        <div class="card-body text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 class="text-2xl font-bold mt-4">Permit Not Active</h2>
          <p class="text-gray-500 mt-2">This permit is currently <strong>{{ permit?.status }}</strong> and is not valid for verification.</p>
          <p class="text-sm text-gray-400 mt-1">Permit ID: {{ route.params.permit_id }}</p>
        </div>
      </div>

      <!-- Valid / Active Permit -->
      <div v-else class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Verified Badge -->
          <div class="text-center mb-6">
            <div class="badge badge-success badge-lg gap-2 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Business Permit
            </div>
          </div>

          <!-- Permit Header -->
          <div class="text-center border-b pb-4 mb-4">
            <h1 class="text-2xl font-bold text-primary">Single Business Permit</h1>
            <p class="text-lg font-mono font-semibold mt-1">{{ permit?.permit_id }}</p>
          </div>

          <!-- Business Details -->
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="font-semibold">Business Name:</span>
              <span>{{ permit?.applicant_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">KRA PIN:</span>
              <span>{{ permit?.kra_pin }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Business Activity:</span>
              <span>{{ permit?.business_activity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Location:</span>
              <span>{{ permit?.sub_county }}{{ permit?.ward ? ', ' + permit.ward : '' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Plot / Building:</span>
              <span>{{ permit?.plot_no || 'N/A' }}{{ permit?.building ? ', ' + permit.building : '' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Fee Paid:</span>
              <span class="font-bold text-success">{{ formatCurrency(permit?.fee_paid) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Valid From:</span>
              <span>{{ formatDate(permit?.effective_date) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Expiry Date:</span>
              <span class="font-bold" :class="permit?.is_expired ? 'text-error' : 'text-success'">
                {{ formatDate(permit?.expiry_date) }}
              </span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="divider"></div>
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-2">Scan to verify</p>
            <QRCodeDisplay
              :qr-data-url="permit?.qr_code"
              :permit-id="permit?.permit_id"
              :size="160"
            />
          </div>

          <!-- Footer -->
          <div class="divider"></div>
          <p class="text-xs text-center text-gray-400">
            Issued by West Pokot County Government | {{ formatDate(permit?.issued_at) }}
          </p>
        </div>
      </div>

      <!-- Back link -->
      <div class="text-center mt-6">
        <a href="/" class="link link-primary text-sm">Back to West Pokot County Portal</a>
      </div>
    </div>
  </div>
</template>
