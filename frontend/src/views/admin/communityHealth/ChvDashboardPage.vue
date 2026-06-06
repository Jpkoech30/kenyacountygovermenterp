<script setup>
/**
 * ChvDashboardPage.vue
 * CHV-specific dashboard showing their assigned households, recent visits, and metrics.
 */
import { ref, onMounted } from 'vue'
import { useCommunityHealthStore } from '../../../stores/communityHealth'

const store = useCommunityHealthStore()
const loading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchChvDashboard(),
      store.fetchChvHouseholds(),
      store.fetchChvVisits(),
    ])
  } catch (e) {
    console.error('Failed to load CHV dashboard:', e)
  } finally {
    loading.value = false
  }
})

const dashboard = store.chvDashboard
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">My Dashboard</h1>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">My Households</div>
          <div class="stat-value text-primary">{{ dashboard?.totalHouseholds || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Visits This Month</div>
          <div class="stat-value text-secondary">{{ dashboard?.visitsThisMonth || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Pending Follow-ups</div>
          <div class="stat-value text-warning">{{ dashboard?.pendingFollowUps || 0 }}</div>
        </div>
      </div>

      <!-- My Households -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">My Households</h2>
          <div v-if="store.chvHouseholds.length === 0" class="text-base-content/60 text-center py-4">
            No households assigned.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>HH Number</th>
                  <th>Head</th>
                  <th>Village</th>
                  <th>Family Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hh in store.chvHouseholds" :key="hh.id">
                  <td><code>{{ hh.household_number }}</code></td>
                  <td>{{ hh.household_head }}</td>
                  <td>{{ hh.village }}</td>
                  <td>{{ hh.family_size || 0 }}</td>
                  <td>
                    <span class="badge badge-sm" :class="hh.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ hh.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Visits -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">My Recent Visits</h2>
          <div v-if="store.chvVisits.length === 0" class="text-base-content/60 text-center py-4">
            No visits recorded yet.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Household</th>
                  <th>Type</th>
                  <th>Referrals</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in store.chvVisits" :key="visit.id">
                  <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                  <td>{{ visit.household?.household_number }}</td>
                  <td><span class="badge badge-sm">{{ visit.visit_type }}</span></td>
                  <td>{{ visit.referrals_made || 0 }}</td>
                  <td>
                    <span v-if="visit.follow_up_required" class="badge badge-sm badge-warning">Yes</span>
                    <span v-else class="badge badge-sm badge-ghost">No</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
