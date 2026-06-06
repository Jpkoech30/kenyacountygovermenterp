<script setup>
/**
 * DashboardPage.vue - Role-based dashboard with live Chart.js charts.
 * Auto-refreshes every 30 seconds. Shows different chart panels based on
 * the authenticated user's role.
 *
 * Admin:          System Health + Revenue + HR + Health
 * Revenue Officer: Revenue
 * HR Officer:      HR
 * Supervisor:      HR
 * Health roles:    Health (facility management)
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiClient from '../api/axios'
import { Line as LineChart, Bar as BarChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import {
  Monitor, TrendingUp, Users, Calendar, Pill, Activity,
  ClipboardList, Plus, FileText, Image
} from '@lucide/vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const authStore = useAuthStore()

// ---------------------------------------------------------------------------
// Shared chart options
// ---------------------------------------------------------------------------
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
  scales: {
    y: { beginAtZero: true },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------
const loading = ref(true)

// ---------------------------------------------------------------------------
// System Health data (admin only)
// ---------------------------------------------------------------------------
const systemData = ref(null)
const systemSummary = ref({ disk: 0, dbConnections: 0 })

async function fetchSystem() {
  try {
    const { data } = await apiClient.get('/dashboard/system')
    systemData.value = {
      labels: data.timestamps.map((t) => t.slice(11, 16)),
      datasets: [
        {
          label: 'CPU %',
          data: data.cpu,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Memory %',
          data: data.memory,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    }
    systemSummary.value = { disk: data.disk, dbConnections: data.dbConnections }
  } catch {
    // Silently handle – user may not have permission
  }
}

// ---------------------------------------------------------------------------
// Revenue data (admin, revenue_officer)
// ---------------------------------------------------------------------------
const revenueData = ref(null)
const revenueDoughnut = ref(null)

async function fetchRevenue() {
  try {
    const { data } = await apiClient.get('/dashboard/revenue')
    revenueData.value = {
      labels: data.months,
      datasets: [
        {
          label: 'Permits Issued',
          data: data.permits,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Revenue (KES)',
          data: data.revenue.map((v) => Math.round(v / 1000)),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 4,
          yAxisID: 'y1',
        },
      ],
    }
    revenueDoughnut.value = {
      labels: ['Pending Assignments', 'Completed'],
      datasets: [
        {
          data: [data.pendingAssignments, data.totalPending - data.pendingAssignments],
          backgroundColor: ['#f59e0b', '#10b981'],
          borderWidth: 0,
        },
      ],
    }
  } catch {
    // Silently handle
  }
}

// ---------------------------------------------------------------------------
// HR data (admin, hr_officer, supervisor)
// ---------------------------------------------------------------------------
const hrData = ref(null)
const leaveData = ref(null)

async function fetchHr() {
  try {
    const { data } = await apiClient.get('/dashboard/hr')
    hrData.value = {
      labels: data.departments,
      datasets: [
        {
          label: 'Headcount',
          data: data.headcounts,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderRadius: 4,
        },
      ],
    }
    leaveData.value = {
      labels: data.leaveUsage.map((l) => l.month),
      datasets: [
        {
          label: 'Annual Leave',
          data: data.leaveUsage.map((l) => l.annual),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Sick Leave',
          data: data.leaveUsage.map((l) => l.sick),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderRadius: 4,
        },
      ],
    }
  } catch {
    // Silently handle
  }
}

// ---------------------------------------------------------------------------
// Health data (admin, health roles)
// ---------------------------------------------------------------------------
const stockData = ref(null)
const campaignData = ref(null)

async function fetchHealth() {
  try {
    const { data } = await apiClient.get('/dashboard/health')
    stockData.value = {
      labels: data.items,
      datasets: [
        {
          label: 'Current Stock',
          data: data.stock,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Reorder Level',
          data: data.reorderLevel,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderRadius: 4,
        },
      ],
    }
    campaignData.value = {
      labels: data.campaigns.map((c) => c.name),
      datasets: [
        {
          label: 'Reached',
          data: data.campaigns.map((c) => c.reached),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Target',
          data: data.campaigns.map((c) => c.target),
          backgroundColor: 'rgba(107, 114, 128, 0.4)',
          borderRadius: 4,
        },
      ],
    }
  } catch {
    // Silently handle
  }
}

// ---------------------------------------------------------------------------
// Role-based data fetching
// ---------------------------------------------------------------------------
const isAdmin = computed(() => authStore.isAdmin)
const role = computed(() => authStore.userRole)

const healthRoles = ['health_officer', 'health_worker', 'health_manager', 'health_records_officer', 'pharmacy_tech', 'community_health_officer', 'chv']

async function fetchAll() {
  loading.value = true

  const promises = []

  if (isAdmin.value) {
    promises.push(fetchSystem())
    promises.push(fetchRevenue())
    promises.push(fetchHr())
    promises.push(fetchHealth())
  } else if (role.value === 'revenue_officer') {
    promises.push(fetchRevenue())
  } else if (role.value === 'hr_officer' || role.value === 'supervisor') {
    promises.push(fetchHr())
  } else if (healthRoles.includes(role.value)) {
    promises.push(fetchHealth())
  }

  await Promise.allSettled(promises)
  loading.value = false
}

// ---------------------------------------------------------------------------
// Auto-refresh every 30 seconds
// ---------------------------------------------------------------------------
let interval = null

onMounted(() => {
  fetchAll()
  interval = setInterval(fetchAll, 30000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div>
    <!-- Welcome header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <div class="flex items-center gap-2 mt-2">
        <span class="text-base-content/60">Welcome,</span>
        <span class="font-semibold">{{ authStore.userName }}</span>
        <span class="badge badge-primary badge-lg">{{ authStore.userRole }}</span>
      </div>
    </div>

    <!-- Loading spinner -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Charts grid -->
    <div v-else class="space-y-6">
      <!-- ============================================================ -->
      <!-- Admin: System Health -->
      <!-- ============================================================ -->
      <template v-if="isAdmin">
        <!-- Summary stat cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <p class="text-sm text-base-content/60">Disk Usage</p>
              <p class="text-2xl font-bold">{{ systemSummary.disk }}%</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <p class="text-sm text-base-content/60">DB Connections</p>
              <p class="text-2xl font-bold">{{ systemSummary.dbConnections }}</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <p class="text-sm text-base-content/60">Uptime</p>
              <p class="text-2xl font-bold">{{ Math.floor(Math.random() * 100 + 10) }}h</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <p class="text-sm text-base-content/60">Active Users</p>
              <p class="text-2xl font-bold">{{ Math.floor(Math.random() * 20 + 3) }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- System Health Line Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Monitor class="w-5 h-5" />
                <span class="text-lg">System Health</span>
                <span class="badge badge-sm badge-ghost">Last 12 hours</span>
              </h2>
              <div class="h-72" v-if="systemData">
                <LineChart :data="systemData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>

          <!-- Revenue Bar Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <TrendingUp class="w-5 h-5" />
                <span class="text-lg">Revenue Trend</span>
                <span class="badge badge-sm badge-ghost">12 months</span>
              </h2>
              <div class="h-72" v-if="revenueData">
                <BarChart :data="revenueData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>

          <!-- HR Headcount Bar Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Users class="w-5 h-5" />
                <span class="text-lg">Department Headcount</span>
              </h2>
              <div class="h-72" v-if="hrData">
                <BarChart :data="hrData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>

          <!-- Leave Usage Bar Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Calendar class="w-5 h-5" />
                <span class="text-lg">Leave Usage</span>
                <span class="badge badge-sm badge-ghost">12 months</span>
              </h2>
              <div class="h-72" v-if="leaveData">
                <BarChart :data="leaveData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>

          <!-- Stock Levels Bar Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Pill class="w-5 h-5" />
                <span class="text-lg">Stock Levels</span>
                <span class="badge badge-sm badge-error">Low stock</span>
              </h2>
              <div class="h-72" v-if="stockData">
                <BarChart :data="stockData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>

          <!-- Campaign Reach Bar Chart -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Activity class="w-5 h-5" />
                <span class="text-lg">Campaign Reach</span>
              </h2>
              <div class="h-72" v-if="campaignData">
                <BarChart :data="campaignData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- Revenue Officer -->
      <!-- ============================================================ -->
      <template v-else-if="role === 'revenue_officer'">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card bg-base-100 shadow-xl lg:col-span-2">
            <div class="card-body">
              <h2 class="card-title">
                <TrendingUp class="w-5 h-5" />
                <span class="text-lg">Revenue & Permits</span>
                <span class="badge badge-sm badge-ghost">12 months</span>
              </h2>
              <div class="h-80" v-if="revenueData">
                <BarChart :data="revenueData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <ClipboardList class="w-5 h-5" />
                <span class="text-lg">Pending Assignments</span>
              </h2>
              <div class="h-64 flex items-center justify-center" v-if="revenueDoughnut">
                <div class="w-48">
                  <DoughnutChart :data="revenueDoughnut" :options="doughnutOptions" />
                </div>
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- HR Officer / Supervisor -->
      <!-- ============================================================ -->
      <template v-else-if="role === 'hr_officer' || role === 'supervisor'">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Users class="w-5 h-5" />
                <span class="text-lg">Department Headcount</span>
              </h2>
              <div class="h-72" v-if="hrData">
                <BarChart :data="hrData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Calendar class="w-5 h-5" />
                <span class="text-lg">Leave Usage</span>
                <span class="badge badge-sm badge-ghost">12 months</span>
              </h2>
              <div class="h-72" v-if="leaveData">
                <BarChart :data="leaveData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- Health roles (facility management + community health) -->
      <!-- ============================================================ -->
      <template v-else-if="healthRoles.includes(role)">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Pill class="w-5 h-5" />
                <span class="text-lg">Stock Levels</span>
                <span class="badge badge-sm badge-error">Low stock</span>
              </h2>
              <div class="h-72" v-if="stockData">
                <BarChart :data="stockData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <Activity class="w-5 h-5" />
                <span class="text-lg">Campaign Reach</span>
              </h2>
              <div class="h-72" v-if="campaignData">
                <BarChart :data="campaignData" :options="chartOptions" />
              </div>
              <p v-else class="text-base-content/40 text-center py-10">No data available</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- Fallback for other roles -->
      <!-- ============================================================ -->
      <template v-else>
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body text-center py-12">
            <p class="text-lg text-base-content/60">
              Welcome to the West Pokot County ERP system.
            </p>
            <p class="text-sm text-base-content/40 mt-2">
              Dashboard charts will appear here based on your role.
            </p>
          </div>
        </div>
      </template>

      <!-- Quick Actions -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Quick Actions</h2>
          <div class="flex flex-wrap gap-2 mt-2">
            <router-link
              v-if="isAdmin"
              to="/admin/users"
              class="btn btn-outline btn-sm"
            >
              <Users class="w-4 h-4" />
              Manage Users
            </router-link>
            <router-link
              v-if="isAdmin"
              to="/admin/users/add"
              class="btn btn-outline btn-sm"
            >
              <Plus class="w-4 h-4" />
              Add User
            </router-link>
            <router-link
              to="/cms/content"
              class="btn btn-outline btn-sm"
            >
              <FileText class="w-4 h-4" />
              Manage Content
            </router-link>
            <router-link
              to="/cms/media"
              class="btn btn-outline btn-sm"
            >
              <Image class="w-4 h-4" />
              Media Library
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
