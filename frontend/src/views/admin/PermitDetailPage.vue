<script setup>
/**
 * PermitDetailPage.vue
 * Full permit details with payment info, assignment status, and actions.
 * Clerk sees "Issue Permit" button; Revenue Officer sees "Assign" button.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { usePermitStore } from '../../stores/permits'
import QRCodeDisplay from '../../components/QRCodeDisplay.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const permitStore = usePermitStore()

const issuing = ref(false)
const renewing = ref(false)

const permit = computed(() => permitStore.currentPermit)
const userRole = computed(() => authStore.user?.role?.name)
const isClerk = computed(() => userRole.value === 'revenue_clerk' || userRole.value === 'admin')
const isRevenueOfficer = computed(() => userRole.value === 'revenue_officer' || userRole.value === 'admin')

const statusBadge = (status) => {
  const map = {
    draft: 'badge-ghost',
    pending_payment: 'badge-warning',
    paid: 'badge-info',
    active: 'badge-success',
    expired: 'badge-error',
    renewed: 'badge-neutral',
  }
  return `badge ${map[status] || 'badge-ghost'}`
}

async function loadPermit() {
  await permitStore.fetchPermit(route.params.id)
}

async function handleIssue() {
  if (!confirm('Issue this permit? This will generate a QR code and PDF.')) return
  issuing.value = true
  try {
    await permitStore.issuePermit(permit.value.id)
    await loadPermit()
  } finally {
    issuing.value = false
  }
}

async function handleRenew() {
  renewing.value = true
  try {
    const result = await permitStore.renewPermit(permit.value.id)
    router.push(`/admin/permits/${result.permit.id}`)
  } finally {
    renewing.value = false
  }
}

function formatCurrency(amount) {
  return `KES ${parseFloat(amount || 0).toLocaleString()}`
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

onMounted(loadPermit)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="permitStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="permitStore.error" class="alert alert-error">
      <span>{{ permitStore.error }}</span>
    </div>

    <template v-else-if="permit">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold font-mono">{{ permit.permit_id }}</h1>
            <span :class="statusBadge(permit.status)">{{ permit.status.replace('_', ' ') }}</span>
          </div>
          <p class="text-sm text-gray-500">{{ permit.applicant_name }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="isClerk && permit.status === 'paid'"
            class="btn btn-primary"
            :disabled="issuing"
            @click="handleIssue"
          >
            <span v-if="issuing" class="loading loading-spinner loading-xs"></span>
            Issue Permit
          </button>
          <button
            v-if="permit.status === 'active' || permit.status === 'expired'"
            class="btn btn-outline"
            :disabled="renewing"
            @click="handleRenew"
          >
            <span v-if="renewing" class="loading loading-spinner loading-xs"></span>
            Renew
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Business Details -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Business Details</h2>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <tbody>
                    <tr><td class="font-semibold w-40">Business Name</td><td>{{ permit.applicant_name }}</td></tr>
                    <tr><td class="font-semibold">KRA PIN</td><td>{{ permit.kra_pin }}</td></tr>
                    <tr><td class="font-semibold">Business Activity</td><td>{{ permit.business_activity }}</td></tr>
                    <tr><td class="font-semibold">Activity Code</td><td>{{ permit.activity_code || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Employees</td><td>{{ permit.employee_size }}</td></tr>
                    <tr><td class="font-semibold">Permit Type</td><td>{{ permit.permitType?.name || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Fee Paid</td><td>{{ formatCurrency(permit.fee_paid) }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Location Details -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Location</h2>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <tbody>
                    <tr><td class="font-semibold w-40">Sub-County</td><td>{{ permit.sub_county || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Ward</td><td>{{ permit.ward || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Plot No.</td><td>{{ permit.plot_no || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Road/Street</td><td>{{ permit.road_street || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Building</td><td>{{ permit.building || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Floor</td><td>{{ permit.floor || 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Door/Stall No.</td><td>{{ permit.door_stall_no || 'N/A' }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Validity -->
          <div v-if="permit.effective_date" class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Validity Period</h2>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <tbody>
                    <tr><td class="font-semibold w-40">Effective Date</td><td>{{ formatDate(permit.effective_date) }}</td></tr>
                    <tr><td class="font-semibold">Expiry Date</td><td>{{ formatDate(permit.expiry_date) }}</td></tr>
                    <tr><td class="font-semibold">Issued By</td><td>{{ permit.issuer ? `${permit.issuer.first_name} ${permit.issuer.last_name}` : 'N/A' }}</td></tr>
                    <tr><td class="font-semibold">Issued At</td><td>{{ formatDate(permit.issued_at) }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Transactions -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Payment Transactions</h2>
              <div v-if="permit.transactions?.length" class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr><th>Receipt</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="txn in permit.transactions" :key="txn.id">
                      <td class="font-mono text-sm">{{ txn.mpesa_receipt || 'N/A' }}</td>
                      <td>{{ formatCurrency(txn.amount) }}</td>
                      <td>
                        <span class="badge" :class="txn.payment_status === 'completed' ? 'badge-success' : txn.payment_status === 'failed' ? 'badge-error' : 'badge-warning'">
                          {{ txn.payment_status }}
                        </span>
                      </td>
                      <td class="text-sm">{{ formatDate(txn.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-gray-400 text-sm">No transactions yet</p>
            </div>
          </div>

          <!-- Assignment -->
          <div v-if="permit.assignment" class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Assignment</h2>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <tbody>
                    <tr><td class="font-semibold w-40">Status</td><td><span class="badge" :class="permit.assignment.status === 'completed' ? 'badge-success' : 'badge-warning'">{{ permit.assignment.status }}</span></td></tr>
                    <tr><td class="font-semibold">Assigned To</td><td>{{ permit.assignment.clerk?.first_name }} {{ permit.assignment.clerk?.last_name }}</td></tr>
                    <tr><td class="font-semibold">Assigned By</td><td>{{ permit.assignment.assigner?.first_name }} {{ permit.assignment.assigner?.last_name }}</td></tr>
                    <tr><td class="font-semibold">Assigned At</td><td>{{ formatDate(permit.assignment.assigned_at) }}</td></tr>
                    <tr v-if="permit.assignment.completed_at"><td class="font-semibold">Completed At</td><td>{{ formatDate(permit.assignment.completed_at) }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: QR Code -->
        <div class="space-y-6">
          <div v-if="permit.qr_code || permit.status === 'active'" class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title">QR Code</h2>
              <QRCodeDisplay
                :qr-data-url="permit.qr_code"
                :permit-id="permit.permit_id"
                :size="180"
              />
              <p class="text-xs text-gray-400 mt-2">Scan to verify permit authenticity</p>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Quick Actions</h2>
              <div class="space-y-2">
                <button class="btn btn-outline btn-sm w-full" @click="router.push('/admin/permits')">
                  ← Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
