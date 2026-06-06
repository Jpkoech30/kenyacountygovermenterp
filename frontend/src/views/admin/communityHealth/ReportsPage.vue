<script setup>
/**
 * ReportsPage.vue
 * Community Health Extension reports and analytics.
 */
import { ref, onMounted } from 'vue'
import { useCommunityHealthStore } from '../../../stores/communityHealth'

const store = useCommunityHealthStore()
const loading = ref(true)
const activeReport = ref('overview')

onMounted(async () => {
  try {
    await store.fetchDashboardMetrics()
    await store.fetchCommunityUnits({ limit: 200 })
    await store.fetchVolunteers({ limit: 200 })
    await store.fetchHouseholds({ limit: 200 })
  } catch (e) {
    console.error('Failed to load reports data:', e)
  } finally {
    loading.value = false
  }
})

const metrics = store.dashboardMetrics
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Community Health Reports</h1>

    <!-- Report tabs -->
    <div role="tablist" class="tabs tabs-boxed">
      <a role="tab" class="tab" :class="{'tab-active': activeReport === 'overview'}" @click="activeReport = 'overview'">Overview</a>
      <a role="tab" class="tab" :class="{'tab-active': activeReport === 'units'}" @click="activeReport = 'units'">By Unit</a>
      <a role="tab" class="tab" :class="{'tab-active': activeReport === 'chvs'}" @click="activeReport = 'chvs'">By CHV</a>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Overview Report -->
    <template v-if="activeReport === 'overview' && !loading">
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
          <div class="stat-title">Total Households</div>
          <div class="stat-value text-accent">{{ metrics?.totalHouseholds || 0 }}</div>
        </div>
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-title">Visits This Month</div>
          <div class="stat-value text-info">{{ metrics?.visitsThisMonth || 0 }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Community Units Summary</h2>
            <div class="overflow-x-auto mt-4">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>CHVs</th>
                    <th>Households</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="unit in store.communityUnits" :key="unit.id">
                    <td>{{ unit.name }}</td>
                    <td>{{ unit.total_chvs || 0 }}</td>
                    <td>{{ unit.total_households || 0 }}</td>
                    <td>
                      <span class="badge badge-sm" :class="unit.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ unit.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">CHV Summary</h2>
            <div class="overflow-x-auto mt-4">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>CHV</th>
                    <th>Training</th>
                    <th>Households</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="chv in store.volunteers" :key="chv.id">
                    <td>{{ chv.full_name }}</td>
                    <td><span class="badge badge-sm badge-outline">{{ chv.training_level || 'N/A' }}</span></td>
                    <td>{{ chv.household_assignments || 0 }}</td>
                    <td>
                      <span class="badge badge-sm" :class="chv.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ chv.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- By Unit Report -->
    <template v-if="activeReport === 'units' && !loading">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Units Detail</h2>
          <div class="overflow-x-auto mt-4">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Ward</th>
                  <th>Sub-County</th>
                  <th>CHVs</th>
                  <th>Households</th>
                  <th>Established</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="unit in store.communityUnits" :key="unit.id">
                  <td><code>{{ unit.code }}</code></td>
                  <td class="font-medium">{{ unit.name }}</td>
                  <td>{{ unit.ward }}</td>
                  <td>{{ unit.sub_county }}</td>
                  <td>{{ unit.total_chvs || 0 }}</td>
                  <td>{{ unit.total_households || 0 }}</td>
                  <td>{{ unit.established_date ? new Date(unit.established_date).toLocaleDateString() : '-' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="unit.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ unit.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- By CHV Report -->
    <template v-if="activeReport === 'chvs' && !loading">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">CHV Detail</h2>
          <div class="overflow-x-auto mt-4">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>National ID</th>
                  <th>Phone</th>
                  <th>Unit</th>
                  <th>Training</th>
                  <th>Households</th>
                  <th>Trained Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chv in store.volunteers" :key="chv.id">
                  <td class="font-medium">{{ chv.full_name }}</td>
                  <td>{{ chv.national_id }}</td>
                  <td>{{ chv.phone }}</td>
                  <td>{{ chv.community_unit?.name || '-' }}</td>
                  <td><span class="badge badge-sm badge-outline">{{ chv.training_level || 'N/A' }}</span></td>
                  <td>{{ chv.household_assignments || 0 }}</td>
                  <td>{{ chv.trained_date ? new Date(chv.trained_date).toLocaleDateString() : '-' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="chv.status === 'active' ? 'badge-success' : chv.status === 'suspended' ? 'badge-warning' : 'badge-ghost'">{{ chv.status }}</span>
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
