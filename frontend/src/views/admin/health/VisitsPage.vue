<script setup>
/**
 * VisitsPage.vue
 * Patient visits page with record visit form and list of visits.
 * Uses DaisyUI table, tabs, form, and pagination components.
 */
import { ref, onMounted } from 'vue'
import { useHealthStore } from '../../../stores/health'
import VisitForm from '../../../components/health/VisitForm.vue'

const healthStore = useHealthStore()

const loading = ref(false)
const showRecordForm = ref(false)
const activeTab = ref('list')
const filterType = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')

onMounted(async () => {
  await loadVisits()
})

async function loadVisits() {
  loading.value = true
  try {
    const params = { page: healthStore.visitsPagination.page }
    if (filterType.value) params.facility_type = filterType.value
    if (filterStartDate.value) params.start_date = filterStartDate.value
    if (filterEndDate.value) params.end_date = filterEndDate.value
    await healthStore.fetchVisits(params)
  } finally {
    loading.value = false
  }
}

function onSaved() {
  showRecordForm.value = false
  activeTab.value = 'list'
  loadVisits()
}

function changePage(page) {
  healthStore.visitsPagination.page = page
  loadVisits()
}

const visits = healthStore.visits
const pagination = healthStore.visitsPagination
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Patient Visits</h1>
      <button class="btn btn-primary" @click="showRecordForm = true">+ Record Visit</button>
    </div>

    <!-- Record Visit Form -->
    <div v-if="showRecordForm">
      <VisitForm @saved="onSaved" @cancel="showRecordForm = false" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-boxed">
        <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'list' }" @click="activeTab = 'list'">Visit List</a>
        <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'appointments' }" @click="activeTab = 'appointments'">Appointments</a>
      </div>

      <!-- Visit List -->
      <div v-if="activeTab === 'list'">
        <!-- Filters -->
        <div class="flex flex-wrap gap-2 mb-4">
          <select v-model="filterType" class="select select-bordered select-sm" @change="loadVisits">
            <option value="">All Types</option>
            <option value="outpatient">Outpatient</option>
            <option value="inpatient">Inpatient</option>
            <option value="emergency">Emergency</option>
          </select>
          <input v-model="filterStartDate" type="date" class="input input-bordered input-sm" @change="loadVisits" placeholder="Start date" />
          <input v-model="filterEndDate" type="date" class="input input-bordered input-sm" @change="loadVisits" placeholder="End date" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
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
              <tr v-for="visit in visits" :key="visit.id">
                <td class="font-medium">{{ visit.patient?.first_name }} {{ visit.patient?.last_name }}</td>
                <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                <td><span class="badge badge-sm">{{ visit.facility_type }}</span></td>
                <td class="max-w-xs truncate">{{ visit.diagnosis }}</td>
                <td class="max-w-xs truncate">{{ visit.treatment || '—' }}</td>
                <td>{{ visit.referred_to || '—' }}</td>
              </tr>
              <tr v-if="visits.length === 0">
                <td colspan="6" class="text-center text-base-content/60 py-8">No visits recorded.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-4">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">«</button>
            <button class="join-item btn btn-sm" v-for="p in pagination.totalPages" :key="p" :class="{ 'btn-active': p === pagination.page }" @click="changePage(p)">{{ p }}</button>
            <button class="join-item btn btn-sm" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">»</button>
          </div>
        </div>
      </div>

      <!-- Appointments Tab -->
      <div v-if="activeTab === 'appointments'">
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apt in healthStore.appointments" :key="apt.id">
                <td class="font-medium">{{ apt.patient?.first_name }} {{ apt.patient?.last_name }}</td>
                <td>{{ new Date(apt.appointment_date).toLocaleDateString() }}</td>
                <td>{{ apt.doctor ? `${apt.doctor.first_name} ${apt.doctor.last_name}` : '—' }}</td>
                <td>
                  <span class="badge" :class="{ 'badge-success': apt.status === 'completed', 'badge-warning': apt.status === 'scheduled', 'badge-error': apt.status === 'cancelled' }">
                    {{ apt.status }}
                  </span>
                </td>
                <td class="max-w-xs truncate">{{ apt.reason || '—' }}</td>
              </tr>
              <tr v-if="healthStore.appointments.length === 0">
                <td colspan="5" class="text-center text-base-content/60 py-8">No appointments found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
