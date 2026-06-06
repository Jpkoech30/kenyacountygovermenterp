<script setup>
/**
 * HealthDashboardPage.vue
 * Dashboard showing at-a-glance metrics: stock alerts, recent visits, upcoming campaigns.
 * Uses Chart.js cards, DaisyUI stats, and custom InventoryCard component.
 */
import { ref, onMounted } from 'vue'
import { useHealthStore } from '../../../stores/health'
import InventoryCard from '../../../components/health/InventoryCard.vue'

const healthStore = useHealthStore()
const loading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([
      healthStore.fetchDashboardMetrics(),
      healthStore.fetchStockAlerts(),
      healthStore.fetchVisits({ limit: 5 }),
      healthStore.fetchCampaigns({ limit: 5 }),
    ])
  } catch (e) {
    console.error('Failed to load health dashboard:', e)
  } finally {
    loading.value = false
  }
})

const metrics = healthStore.dashboardMetrics
const stockAlerts = healthStore.stockAlerts
const recentVisits = healthStore.visits
const campaigns = healthStore.campaigns
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Health Facility Dashboard</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Metrics row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Total Patients</div>
          <div class="stat-value text-primary">{{ metrics?.totalPatients || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Total Visits</div>
          <div class="stat-value text-secondary">{{ metrics?.totalVisits || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Active Campaigns</div>
          <div class="stat-value text-accent">{{ metrics?.activeCampaigns || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Inventory Items</div>
          <div class="stat-value text-info">{{ metrics?.totalInventoryItems || 0 }}</div>
        </div>
      </div>

      <!-- Inventory Card + Recent Visits -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryCard
          :low-stock-count="stockAlerts?.lowStockItems?.length || 0"
          :expiring-count="stockAlerts?.expiringItems?.length || 0"
          :total-items="metrics?.totalInventoryItems || 0"
          :loading="loading"
        />

        <!-- Recent Visits -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recent Visits</h2>
            <div v-if="recentVisits.length === 0" class="text-base-content/60 text-center py-4">
              No recent visits recorded.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="visit in recentVisits" :key="visit.id">
                    <td class="font-medium">{{ visit.patient?.first_name }} {{ visit.patient?.last_name }}</td>
                    <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                    <td><span class="badge badge-sm">{{ visit.facility_type }}</span></td>
                    <td class="max-w-xs truncate">{{ visit.diagnosis }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Campaigns -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Upcoming Campaigns</h2>
          <div v-if="campaigns.length === 0" class="text-base-content/60 text-center py-4">
            No campaigns found.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="campaign in campaigns" :key="campaign.id" class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title text-base">{{ campaign.name }}</h3>
                <div class="badge badge-outline">{{ campaign.campaign_type }}</div>
                <p class="text-sm text-base-content/70 mt-2">{{ campaign.description }}</p>
                <div class="text-xs text-base-content/50">
                  {{ new Date(campaign.start_date).toLocaleDateString() }} — {{ new Date(campaign.end_date).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
