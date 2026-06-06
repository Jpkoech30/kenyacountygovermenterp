<script setup>
/**
 * PermitListPage.vue
 * Admin list of permits with role-based filtering.
 * - Admin: all permits
 * - Revenue Officer: paid permits (for assignment)
 * - Clerk: assigned permits
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { usePermitStore } from '../../stores/permits'

const router = useRouter()
const authStore = useAuthStore()
const permitStore = usePermitStore()

const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

const userRole = computed(() => authStore.user?.role?.name)
const isRevenueOfficer = computed(() => userRole.value === 'revenue_officer' || userRole.value === 'admin')
const isClerk = computed(() => userRole.value === 'revenue_clerk')

// Status badge colors
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

async function loadPermits() {
  const params = { page: currentPage.value, limit: 20 }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  await permitStore.fetchPermits(params)
}

function viewDetails(id) {
  router.push(`/admin/permits/${id}`)
}

function goToAssign() {
  router.push('/admin/permits/assign')
}

function formatCurrency(amount) {
  return `KES ${parseFloat(amount || 0).toLocaleString()}`
}

onMounted(loadPermits)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Business Permits</h1>
        <p class="text-sm text-gray-500">Manage single business permit applications</p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="isRevenueOfficer"
          class="btn btn-primary"
          @click="goToAssign"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Assign Permits
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="form-control flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Search by Permit ID, Business Name, or KRA PIN..."
          class="input input-bordered w-full"
          @input="loadPermits"
        />
      </div>
      <div class="form-control w-full sm:w-48">
        <select v-model="statusFilter" class="select select-bordered w-full" @change="loadPermits">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="renewed">Renewed</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="permitStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="permitStore.error" class="alert alert-error">
      <span>{{ permitStore.error }}</span>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Permit ID</th>
            <th>Business Name</th>
            <th>KRA PIN</th>
            <th>Status</th>
            <th>Fee</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="permit in permitStore.permits" :key="permit.id">
            <td class="font-mono text-sm">{{ permit.permit_id }}</td>
            <td>{{ permit.applicant_name }}</td>
            <td>{{ permit.kra_pin }}</td>
            <td>
              <span :class="statusBadge(permit.status)">
                {{ permit.status.replace('_', ' ') }}
              </span>
            </td>
            <td>{{ formatCurrency(permit.fee_paid) }}</td>
            <td class="text-sm">{{ new Date(permit.created_at).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-sm btn-outline" @click="viewDetails(permit.id)">
                View
              </button>
            </td>
          </tr>
          <tr v-if="permitStore.permits.length === 0">
            <td colspan="7" class="text-center py-8 text-gray-400">
              No permits found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="permitStore.pagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage <= 1"
          @click="currentPage--; loadPermits()"
        >
          «
        </button>
        <button class="join-item btn btn-sm">
          Page {{ permitStore.pagination.page }} of {{ permitStore.pagination.totalPages }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage >= permitStore.pagination.totalPages"
          @click="currentPage++; loadPermits()"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
