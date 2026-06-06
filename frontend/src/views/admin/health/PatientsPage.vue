<script setup>
/**
 * PatientsPage.vue
 * Patient management page with table, search, register new patient, and view history.
 * Uses DaisyUI table, modal, form, and pagination components.
 */
import { ref, onMounted } from 'vue'
import { useHealthStore } from '../../../stores/health'
import PatientRegistrationForm from '../../../components/health/PatientRegistrationForm.vue'

const healthStore = useHealthStore()

const loading = ref(false)
const search = ref('')
const showRegisterForm = ref(false)
const showDetailModal = ref(false)
const selectedPatient = ref(null)

onMounted(async () => {
  await loadPatients()
})

async function loadPatients() {
  loading.value = true
  try {
    const params = { page: healthStore.patientsPagination.page }
    if (search.value.trim()) params.search = search.value.trim()
    await healthStore.fetchPatients(params)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  healthStore.patientsPagination.page = 1
  loadPatients()
}

async function viewPatient(patient) {
  try {
    await healthStore.fetchPatient(patient.id)
    selectedPatient.value = healthStore.currentPatient
    showDetailModal.value = true
  } catch (e) {
    console.error('Failed to load patient:', e)
  }
}

function onSaved() {
  showRegisterForm.value = false
  loadPatients()
}

function changePage(page) {
  healthStore.patientsPagination.page = page
  loadPatients()
}

const patients = healthStore.patients
const pagination = healthStore.patientsPagination
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Patient Management</h1>
      <button class="btn btn-primary" @click="showRegisterForm = true">+ Register Patient</button>
    </div>

    <!-- Register Form -->
    <div v-if="showRegisterForm">
      <PatientRegistrationForm @saved="onSaved" @cancel="showRegisterForm = false" />
    </div>

    <template v-else>
      <!-- Search -->
      <div class="join w-full max-w-md">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or national ID..."
          class="input input-bordered join-item flex-1"
          @keyup.enter="onSearch"
        />
        <button class="btn btn-primary join-item" @click="onSearch" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          Search
        </button>
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
              <th>National ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Village</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="patient in patients" :key="patient.id">
              <td class="font-mono text-sm">{{ patient.national_id }}</td>
              <td class="font-medium">{{ patient.first_name }} {{ patient.last_name }}</td>
              <td class="capitalize">{{ patient.gender }}</td>
              <td>{{ patient.phone }}</td>
              <td>{{ patient.village || '—' }}</td>
              <td>
                <button class="btn btn-ghost btn-xs" @click="viewPatient(patient)">View</button>
              </td>
            </tr>
            <tr v-if="patients.length === 0">
              <td colspan="6" class="text-center text-base-content/60 py-8">No patients found.</td>
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
    </template>

    <!-- Patient Detail Modal -->
    <dialog :open="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg" v-if="selectedPatient">
          {{ selectedPatient.first_name }} {{ selectedPatient.last_name }}
        </h3>

        <div v-if="selectedPatient" class="space-y-4 mt-4">
          <!-- Patient Info -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="font-semibold">National ID:</span> {{ selectedPatient.national_id }}</div>
            <div><span class="font-semibold">Gender:</span> <span class="capitalize">{{ selectedPatient.gender }}</span></div>
            <div><span class="font-semibold">Date of Birth:</span> {{ selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : '—' }}</div>
            <div><span class="font-semibold">Phone:</span> {{ selectedPatient.phone }}</div>
            <div><span class="font-semibold">Email:</span> {{ selectedPatient.email || '—' }}</div>
            <div><span class="font-semibold">Village:</span> {{ selectedPatient.village || '—' }}</div>
          </div>

          <!-- Family Information -->
          <div>
            <h4 class="font-semibold mb-2">Family Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="p-3 bg-base-200 rounded-box">
                <span class="font-semibold">Mother</span>
                <div v-if="selectedPatient.mother" class="mt-1">
                  <div>{{ selectedPatient.mother.first_name }} {{ selectedPatient.mother.last_name }}</div>
                  <div class="text-base-content/60 font-mono text-xs">{{ selectedPatient.mother.national_id }}</div>
                  <div v-if="selectedPatient.mother.phone" class="text-base-content/60 text-xs">{{ selectedPatient.mother.phone }}</div>
                </div>
                <div v-else class="text-base-content/40 mt-1">Not linked</div>
              </div>
              <div class="p-3 bg-base-200 rounded-box">
                <span class="font-semibold">Father</span>
                <div v-if="selectedPatient.father" class="mt-1">
                  <div>{{ selectedPatient.father.first_name }} {{ selectedPatient.father.last_name }}</div>
                  <div class="text-base-content/60 font-mono text-xs">{{ selectedPatient.father.national_id }}</div>
                  <div v-if="selectedPatient.father.phone" class="text-base-content/60 text-xs">{{ selectedPatient.father.phone }}</div>
                </div>
                <div v-else class="text-base-content/40 mt-1">Not linked</div>
              </div>
            </div>
            <!-- Children -->
            <div v-if="selectedPatient.children && selectedPatient.children.length > 0" class="mt-3">
              <span class="font-semibold text-sm">Children ({{ selectedPatient.children.length }})</span>
              <div class="flex flex-wrap gap-2 mt-1">
                <span v-for="child in selectedPatient.children" :key="child.id" class="badge badge-outline badge-sm">
                  {{ child.first_name }} {{ child.last_name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Visit History -->
          <div>
            <h4 class="font-semibold mb-2">Visit History</h4>
            <div v-if="selectedPatient.visits && selectedPatient.visits.length > 0" class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Treatment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="visit in selectedPatient.visits" :key="visit.id">
                    <td>{{ new Date(visit.visit_date).toLocaleDateString() }}</td>
                    <td><span class="badge badge-sm">{{ visit.facility_type }}</span></td>
                    <td class="max-w-xs truncate">{{ visit.diagnosis }}</td>
                    <td class="max-w-xs truncate">{{ visit.treatment || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-sm text-base-content/60">No visits recorded.</div>
          </div>

          <!-- Appointments -->
          <div>
            <h4 class="font-semibold mb-2">Appointments</h4>
            <div v-if="selectedPatient.appointments && selectedPatient.appointments.length > 0" class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="apt in selectedPatient.appointments" :key="apt.id">
                    <td>{{ new Date(apt.appointment_date).toLocaleDateString() }}</td>
                    <td><span class="badge badge-sm" :class="{ 'badge-success': apt.status === 'completed', 'badge-warning': apt.status === 'scheduled', 'badge-error': apt.status === 'cancelled' }">{{ apt.status }}</span></td>
                    <td>{{ apt.reason || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-sm text-base-content/60">No appointments.</div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDetailModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
