<script setup>
/**
 * ReportsPage.vue
 * Health reports page with inventory usage and patient visits summaries.
 * Uses DaisyUI card, table, stat, and button components.
 */
import { ref } from 'vue'
import { useHealthStore } from '../../../stores/health'

const healthStore = useHealthStore()

const loading = ref(false)
const activeReport = ref('')
const reportData = ref(null)
const dateRange = ref({
  start_date: '',
  end_date: '',
})

async function loadInventoryReport() {
  loading.value = true
  activeReport.value = 'inventory'
  try {
    const params = {}
    if (dateRange.value.start_date) params.start_date = dateRange.value.start_date
    if (dateRange.value.end_date) params.end_date = dateRange.value.end_date
    const response = await healthStore.fetchInventoryItems(params)
    reportData.value = response
  } catch (e) {
    console.error('Failed to load inventory report:', e)
  } finally {
    loading.value = false
  }
}

async function loadVisitsReport() {
  loading.value = true
  activeReport.value = 'visits'
  try {
    const params = { limit: 100 }
    if (dateRange.value.start_date) params.start_date = dateRange.value.start_date
    if (dateRange.value.end_date) params.end_date = dateRange.value.end_date
    const response = await healthStore.fetchVisits(params)
    reportData.value = response
  } catch (e) {
    console.error('Failed to load visits report:', e)
  } finally {
    loading.value = false
  }
}

function exportCSV() {
  if (!reportData.value) return

  let csv = ''
  let filename = ''

  if (activeReport.value === 'inventory') {
    const items = reportData.value.items || []
    csv = 'Code,Name,Category,Stock,Reorder Level,Expiry Date\n'
    csv += items.map((i) =>
      `"${i.code}","${i.name}","${i.category}",${i.current_stock},${i.reorder_level},"${i.expiry_date || ''}"`
    ).join('\n')
    filename = 'inventory-report.csv'
  } else if (activeReport.value === 'visits') {
    const visits = reportData.value.visits || []
    csv = 'Patient Name,Date,Type,Diagnosis,Treatment,Referred To\n'
    csv += visits.map((v) =>
      `"${v.patient?.first_name || ''} ${v.patient?.last_name || ''}","${new Date(v.visit_date).toLocaleDateString()}","${v.facility_type}","${(v.diagnosis || '').replace(/"/g, '""')}","${(v.treatment || '').replace(/"/g, '""')}","${v.referred_to || ''}"`
    ).join('\n')
    filename = 'visits-report.csv'
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Health Reports</h1>

    <!-- Date Range Filter -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Filter by Date Range</h2>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="form-control">
            <label class="label"><span class="label-text">Start Date</span></label>
            <input v-model="dateRange.start_date" type="date" class="input input-bordered input-sm" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">End Date</span></label>
            <input v-model="dateRange.end_date" type="date" class="input input-bordered input-sm" />
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" @click="loadInventoryReport" :disabled="loading">
              <span v-if="loading && activeReport === 'inventory'" class="loading loading-spinner loading-xs"></span>
              Inventory Usage
            </button>
            <button class="btn btn-secondary btn-sm" @click="loadVisitsReport" :disabled="loading">
              <span v-if="loading && activeReport === 'visits'" class="loading loading-spinner loading-xs"></span>
              Patient Visits
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Inventory Report -->
    <div v-else-if="activeReport === 'inventory' && reportData">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="card-title">Inventory Usage Report</h2>
            <button class="btn btn-ghost btn-sm" @click="exportCSV">Export CSV</button>
          </div>

          <div class="stats stats-vertical shadow mb-4">
            <div class="stat">
              <div class="stat-title">Total Items</div>
              <div class="stat-value">{{ reportData.pagination?.total || reportData.items?.length || 0 }}</div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in reportData.items" :key="item.id">
                  <td class="font-mono text-sm">{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td><span class="badge badge-sm">{{ item.category }}</span></td>
                  <td>{{ item.current_stock }} {{ item.unit_of_measure }}</td>
                  <td>{{ item.reorder_level }}</td>
                  <td>{{ item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—' }}</td>
                </tr>
                <tr v-if="!reportData.items || reportData.items.length === 0">
                  <td colspan="6" class="text-center text-base-content/60 py-4">No data available.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Visits Report -->
    <div v-else-if="activeReport === 'visits' && reportData">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="card-title">Patient Visits Report</h2>
            <button class="btn btn-ghost btn-sm" @click="exportCSV">Export CSV</button>
          </div>

          <div class="stats stats-vertical shadow mb-4">
            <div class="stat">
              <div class="stat-title">Total Visits</div>
              <div class="stat-value">{{ reportData.pagination?.total || reportData.visits?.length || 0 }}</div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Diagnosis</th>
                  <th>Treatment</th>
                  <th>Referred To</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in reportData.visits" :key="visit.id">
                  <td class="font-medium">{{ visit.patient?.first_name }} {{ visit.patient?.last_name }}</td>
                  <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                  <td><span class="badge badge-sm">{{ visit.facility_type }}</span></td>
                  <td class="max-w-xs truncate">{{ visit.diagnosis }}</td>
                  <td class="max-w-xs truncate">{{ visit.treatment || '—' }}</td>
                  <td>{{ visit.referred_to || '—' }}</td>
                </tr>
                <tr v-if="!reportData.visits || reportData.visits.length === 0">
                  <td colspan="6" class="text-center text-base-content/60 py-4">No data available.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- No report selected -->
    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body text-center py-12 text-base-content/60">
        Select a report type above to view data.
      </div>
    </div>
  </div>
</template>
