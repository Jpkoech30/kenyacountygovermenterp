<script setup>
/**
 * CommunityHealthDashboardPage.vue
 * Dashboard showing at-a-glance metrics for community health extension.
 * Uses DaisyUI stats, tables, and cards.
 */
import { ref, onMounted } from 'vue'
import { useCommunityHealthStore } from '../../../stores/communityHealth'

const store = useCommunityHealthStore()
const loading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchDashboardMetrics(),
      store.fetchCommunityUnits({ limit: 5 }),
      store.fetchVolunteers({ limit: 5 }),
      store.fetchVisits({ limit: 5 }),
    ])
  } catch (e) {
    console.error('Failed to load community health dashboard:', e)
  } finally {
    loading.value = false
  }
})

const metrics = store.dashboardMetrics
const recentUnits = store.communityUnits
const recentVolunteers = store.volunteers
const recentVisits = store.visits
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Community Health Dashboard</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Metrics row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Community Units</div>
          <div class="stat-value text-primary">{{ metrics?.totalUnits || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Active CHVs</div>
          <div class="stat-value text-secondary">{{ metrics?.activeChvs || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Households Registered</div>
          <div class="stat-value text-accent">{{ metrics?.totalHouseholds || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Visits This Month</div>
          <div class="stat-value text-info">{{ metrics?.visitsThisMonth || 0 }}</div>
        </div>
      </div>

      <!-- Recent Community Units + Recent CHVs -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Community Units -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recent Community Units</h2>
            <div v-if="recentUnits.length === 0" class="text-base-content/60 text-center py-4">
              No community units registered yet.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Ward</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="unit in recentUnits" :key="unit.id">
                    <td class="font-medium">{{ unit.name }}</td>
                    <td><code class="text-xs">{{ unit.code }}</code></td>
                    <td>{{ unit.ward }}</td>
                    <td>
                      <span class="badge badge-sm" :class="unit.status === 'active' ? 'badge-success' : 'badge-ghost'">
                        {{ unit.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent CHVs -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recent CHVs</h2>
            <div v-if="recentVolunteers.length === 0" class="text-base-content/60 text-center py-4">
              No CHVs registered yet.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Training</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="chv in recentVolunteers" :key="chv.id">
                    <td class="font-medium">{{ chv.full_name }}</td>
                    <td>{{ chv.phone }}</td>
                    <td><span class="badge badge-sm badge-outline">{{ chv.training_level || 'N/A' }}</span></td>
                    <td>
                      <span class="badge badge-sm" :class="chv.status === 'active' ? 'badge-success' : 'badge-ghost'">
                        {{ chv.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Visits -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Recent Household Visits</h2>
          <div v-if="recentVisits.length === 0" class="text-base-content/60 text-center py-4">
            No visits recorded yet.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Household</th>
                  <th>CHV</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Referrals</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in recentVisits" :key="visit.id">
                  <td class="font-medium">{{ visit.household?.household_number || visit.household_id }}</td>
                  <td>{{ visit.chv?.full_name || 'N/A' }}</td>
                  <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                  <td><span class="badge badge-sm">{{ visit.visit_type }}</span></td>
                  <td>{{ visit.referrals_made || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
