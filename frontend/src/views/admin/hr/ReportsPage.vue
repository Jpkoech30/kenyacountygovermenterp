<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useHrStore } from '../../../stores/hr'
import { useAuthStore } from '../../../stores/auth'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const hrStore = useHrStore()
const authStore = useAuthStore()

const isHR = computed(() => ['hr_officer', 'admin'].includes(authStore.user?.role?.name))
const isBoard = computed(() => ['board_member', 'admin'].includes(authStore.user?.role?.name))
const canView = computed(() => isHR.value || isBoard.value)

// --- Date range for turnover report ---
const turnoverStart = ref(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
const turnoverEnd = ref(new Date().toISOString().slice(0, 10))

// --- Loading state ---
const loading = ref(false)
const error = ref(null)

// --- Data ---
const headcountData = ref([])
const leaveUsageData = ref([])
const turnoverData = ref([])

async function loadReports() {
  loading.value = true
  error.value = null
  try {
    const [headcount, leaveUsage, turnover] = await Promise.all([
      hrStore.fetchHeadcountReport(),
      hrStore.fetchLeaveUsageReport(),
      hrStore.fetchTurnoverReport({ start_date: turnoverStart.value, end_date: turnoverEnd.value })
    ])
    headcountData.value = hrStore.headcountReport || []
    leaveUsageData.value = hrStore.leaveUsageReport || []
    turnoverData.value = hrStore.turnoverReport || []
  } catch (e) {
    error.value = 'Failed to load reports'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (canView.value) loadReports()
})

watch([turnoverStart, turnoverEnd], () => {
  if (canView.value) loadReports()
})

// ==================== CHART CONFIGURATIONS ====================

// --- Headcount Bar Chart ---
const headcountChartData = computed(() => ({
  labels: headcountData.value.map(d => d.department || 'Unknown'),
  datasets: [{
    label: 'Active Employees',
    backgroundColor: [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
    ],
    data: headcountData.value.map(d => d.count || 0)
  }]
}))

const headcountChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'Headcount by Department',
      font: { size: 14 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

// --- Leave Usage Line Chart ---
const leaveUsageChartData = computed(() => ({
  labels: leaveUsageData.value.map(d => d.month || ''),
  datasets: [{
    label: 'Leave Days Taken',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: true,
    tension: 0.3,
    data: leaveUsageData.value.map(d => d.total_days || 0)
  }]
}))

const leaveUsageChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'Monthly Leave Usage (Current Year)',
      font: { size: 14 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

// --- Turnover Doughnut Chart ---
const turnoverChartData = computed(() => {
  const terminated = turnoverData.value.filter(d => d.status === 'terminated').length || 0
  const retired = turnoverData.value.filter(d => d.status === 'retired').length || 0
  return {
    labels: ['Terminated', 'Retired'],
    datasets: [{
      data: [terminated, retired],
      backgroundColor: ['#ef4444', '#f59e0b'],
      borderWidth: 0
    }]
  }
})

const turnoverChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    title: {
      display: true,
      text: 'Turnover Breakdown',
      font: { size: 14 }
    }
  }
}

// --- Summary stats ---
const totalEmployees = computed(() =>
  headcountData.value.reduce((sum, d) => sum + (d.count || 0), 0)
)

const totalLeaveDays = computed(() =>
  leaveUsageData.value.reduce((sum, d) => sum + (d.total_days || 0), 0)
)

const totalTurnover = computed(() =>
  turnoverData.value.length
)
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold">HR Reports</h1>
      <p class="text-sm text-base-content/70">Headcount, leave usage, and turnover analytics</p>
    </div>

    <!-- Access Denied -->
    <div v-if="!canView" class="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      <span>You do not have permission to view reports. HR Officer, Board Member, or Admin role required.</span>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-xs" @click="loadReports">Retry</button>
    </div>

    <template v-else>
      <!-- Summary Stats -->
      <div class="stats shadow w-full">
        <div class="stat">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div class="stat-title">Total Active Employees</div>
          <div class="stat-value text-primary">{{ totalEmployees }}</div>
          <div class="stat-desc">Across {{ headcountData.length }} departments</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div class="stat-title">Leave Days Taken (YTD)</div>
          <div class="stat-value text-secondary">{{ totalLeaveDays }}</div>
          <div class="stat-desc">Current year</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div class="stat-title">Turnover Events</div>
          <div class="stat-value text-accent">{{ totalTurnover }}</div>
          <div class="stat-desc">Selected period</div>
        </div>
      </div>

      <!-- Turnover Date Range Filter -->
      <div class="flex items-center gap-4 bg-base-200 p-4 rounded-lg">
        <span class="text-sm font-medium">Turnover Period:</span>
        <div class="form-control">
          <input v-model="turnoverStart" type="date" class="input input-bordered input-sm" />
        </div>
        <span class="text-base-content/50">to</span>
        <div class="form-control">
          <input v-model="turnoverEnd" type="date" class="input input-bordered input-sm" />
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Headcount Bar Chart -->
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-5">
            <div v-if="headcountData.length" style="height: 300px;">
              <Bar :data="headcountChartData" :options="headcountChartOptions" />
            </div>
            <div v-else class="flex items-center justify-center h-[300px] text-base-content/40">
              <p>No headcount data available</p>
            </div>
          </div>
        </div>

        <!-- Leave Usage Line Chart -->
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-5">
            <div v-if="leaveUsageData.length" style="height: 300px;">
              <Line :data="leaveUsageChartData" :options="leaveUsageChartOptions" />
            </div>
            <div v-else class="flex items-center justify-center h-[300px] text-base-content/40">
              <p>No leave usage data available</p>
            </div>
          </div>
        </div>

        <!-- Turnover Doughnut Chart -->
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-5">
            <div v-if="turnoverData.length" style="height: 300px;">
              <Doughnut :data="turnoverChartData" :options="turnoverChartOptions" />
            </div>
            <div v-else class="flex items-center justify-center h-[300px] text-base-content/40">
              <p>No turnover data for selected period</p>
            </div>
          </div>
        </div>

        <!-- Headcount Table -->
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-5">
            <h3 class="font-semibold text-sm mb-3">Headcount Details</h3>
            <div v-if="headcountData.length" class="overflow-x-auto">
              <table class="table table-zebra table-xs w-full">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th class="text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in headcountData" :key="d.department">
                    <td>{{ d.department }}</td>
                    <td class="text-right font-medium">{{ d.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-8 text-base-content/40">
              <p>No data</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Turnover Table (full width) -->
      <div class="card bg-base-100 shadow-sm border">
        <div class="card-body p-5">
          <h3 class="font-semibold text-sm mb-3">Turnover Events</h3>
          <div v-if="turnoverData.length" class="overflow-x-auto">
            <table class="table table-zebra table-xs w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in turnoverData" :key="item.id">
                  <td class="font-medium">{{ item.first_name }} {{ item.last_name }}</td>
                  <td>
                    <span class="badge badge-sm" :class="{ 'badge-error': item.status === 'terminated', 'badge-warning': item.status === 'retired' }">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="text-sm">{{ item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—' }}</td>
                  <td class="text-sm">{{ item.Department?.name || '—' }}</td>
                  <td class="text-sm">{{ item.Position?.title || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-8 text-base-content/40">
            <p>No turnover events in selected period</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
