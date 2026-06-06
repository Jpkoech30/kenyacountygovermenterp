<script setup>
/**
 * PermitAssignPage.vue
 * Revenue officer view: select paid permits and assign to a clerk.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermitStore } from '../../stores/permits'
import apiClient from '../../api/axios'

const router = useRouter()
const permitStore = usePermitStore()

const clerks = ref([])
const selectedPermitIds = ref([])
const selectedClerkId = ref('')
const assigning = ref(false)
const successMessage = ref('')

const paidPermits = computed(() =>
  permitStore.permits.filter((p) => p.status === 'paid')
)

const allSelected = computed({
  get: () => paidPermits.value.length > 0 && selectedPermitIds.value.length === paidPermits.value.length,
  set: (val) => {
    selectedPermitIds.value = val ? paidPermits.value.map((p) => p.id) : []
  },
})

async function loadData() {
  await permitStore.fetchPermits({ status: 'paid', limit: 100 })
  try {
    const res = await apiClient.get('/users', { params: { role: 'revenue_clerk', limit: 100 } })
    clerks.value = res.data.users || []
  } catch (err) {
    console.error('Failed to load clerks:', err)
  }
}

function togglePermit(id) {
  const idx = selectedPermitIds.value.indexOf(id)
  if (idx === -1) {
    selectedPermitIds.value.push(id)
  } else {
    selectedPermitIds.value.splice(idx, 1)
  }
}

async function handleAssign() {
  if (!selectedClerkId.value || selectedPermitIds.value.length === 0) return
  assigning.value = true
  successMessage.value = ''
  try {
    const result = await permitStore.assignPermits(selectedPermitIds.value, parseInt(selectedClerkId.value))
    successMessage.value = result.message
    selectedPermitIds.value = []
    selectedClerkId.value = ''
    await loadData()
  } finally {
    assigning.value = false
  }
}

function formatCurrency(amount) {
  return `KES ${parseFloat(amount || 0).toLocaleString()}`
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Assign Permits</h1>
      <p class="text-sm text-gray-500">Select paid permits and assign them to a clerk for processing</p>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Loading -->
    <div v-if="permitStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <!-- Assign Controls -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="form-control flex-1">
              <label class="label"><span class="label-text">Assign to Clerk</span></label>
              <select v-model="selectedClerkId" class="select select-bordered w-full">
                <option value="">Select a clerk...</option>
                <option v-for="clerk in clerks" :key="clerk.id" :value="clerk.id">
                  {{ clerk.first_name }} {{ clerk.last_name }} ({{ clerk.email }})
                </option>
              </select>
            </div>
            <button
              class="btn btn-primary"
              :disabled="!selectedClerkId || selectedPermitIds.length === 0 || assigning"
              @click="handleAssign"
            >
              <span v-if="assigning" class="loading loading-spinner loading-xs"></span>
              Assign Selected ({{ selectedPermitIds.length }})
            </button>
          </div>
        </div>
      </div>

      <!-- Permits Table -->
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th class="w-12">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="allSelected"
                  @change="allSelected = !allSelected"
                />
              </th>
              <th>Permit ID</th>
              <th>Business Name</th>
              <th>KRA PIN</th>
              <th>Fee</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permit in paidPermits" :key="permit.id">
              <td>
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="selectedPermitIds.includes(permit.id)"
                  @change="togglePermit(permit.id)"
                />
              </td>
              <td class="font-mono text-sm">{{ permit.permit_id }}</td>
              <td>{{ permit.applicant_name }}</td>
              <td>{{ permit.kra_pin }}</td>
              <td>{{ formatCurrency(permit.fee_paid) }}</td>
              <td class="text-sm">{{ new Date(permit.created_at).toLocaleDateString() }}</td>
            </tr>
            <tr v-if="paidPermits.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">
                No paid permits available for assignment
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
