<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHrStore } from '../../../stores/hr'
import { useAuthStore } from '../../../stores/auth'

const hrStore = useHrStore()
const authStore = useAuthStore()

const isHR = computed(() => ['hr_officer', 'admin'].includes(authStore.user?.role?.name))

const activeTab = ref('all')
const showNewCaseModal = ref(false)
const showViewModal = ref(false)
const selectedCase = ref(null)

const caseForm = ref({
  employee_id: '',
  case_type: '',
  description: '',
})

const employees = ref([])

async function loadEmployees() {
  try {
    await hrStore.fetchEmployees({ limit: 200 })
    employees.value = hrStore.employees || []
  } catch (e) {
    console.error('Failed to load employees', e)
  }
}

async function loadData() {
  await hrStore.fetchDisciplinaryCases({ status: activeTab.value === 'all' ? undefined : activeTab.value })
}

onMounted(async () => {
  if (isHR.value) {
    await Promise.all([loadData(), loadEmployees()])
  }
})

const filteredCases = computed(() => {
  if (!hrStore.disciplinaryCases) return []
  if (activeTab.value === 'all') return hrStore.disciplinaryCases
  return hrStore.disciplinaryCases.filter((c) => c.status === activeTab.value)
})

const caseTypeLabels = {
  misconduct: 'Misconduct',
  poor_performance: 'Poor Performance',
  absenteeism: 'Absenteeism',
  insubordination: 'Insubordination',
  fraud: 'Fraud',
  other: 'Other',
}

const statusColors = {
  open: 'badge-warning',
  under_investigation: 'badge-info',
  hearing: 'badge-error',
  closed: 'badge-success',
}

async function handleCreateCase() {
  try {
    await hrStore.createDisciplinaryCase({
      employee_id: caseForm.value.employee_id,
      case_type: caseForm.value.case_type,
      description: caseForm.value.description,
    })
    showNewCaseModal.value = false
    caseForm.value = { employee_id: '', case_type: '', description: '' }
    await loadData()
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to create case')
  }
}

function viewCase(c) {
  selectedCase.value = c
  showViewModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Disciplinary Cases</h1>
        <p class="text-base-content/60">Manage employee disciplinary cases and hearings</p>
      </div>
      <button v-if="isHR" class="btn btn-primary btn-sm" @click="showNewCaseModal = true">
        New Case
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-boxed">
      <button class="tab" :class="{ 'tab-active': activeTab === 'all' }" @click="activeTab = 'all'">All</button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'open' }" @click="activeTab = 'open'">Open</button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'under_investigation' }" @click="activeTab = 'under_investigation'">Investigation</button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'hearing' }" @click="activeTab = 'hearing'">Hearing</button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'closed' }" @click="activeTab = 'closed'">Closed</button>
    </div>

    <!-- Cases Table -->
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredCases" :key="c.id">
            <td>{{ c.employee?.first_name }} {{ c.employee?.last_name }}</td>
            <td>{{ caseTypeLabels[c.case_type] || c.case_type }}</td>
            <td>
              <span class="badge badge-sm" :class="statusColors[c.status] || 'badge-ghost'">
                {{ c.status?.replace(/_/g, ' ') }}
              </span>
            </td>
            <td>{{ new Date(c.createdAt).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-ghost btn-xs" @click="viewCase(c)">View</button>
            </td>
          </tr>
          <tr v-if="filteredCases.length === 0">
            <td colspan="5" class="text-center text-base-content/40 py-8">No disciplinary cases found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- New Case Modal -->
    <dialog class="modal" :class="{ 'modal-open': showNewCaseModal }">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">New Disciplinary Case</h3>
        <form @submit.prevent="handleCreateCase" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Employee</span></label>
            <select v-model="caseForm.employee_id" class="select select-bordered" required>
              <option value="" disabled>Select employee</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.first_name }} {{ emp.last_name }}
              </option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Case Type</span></label>
            <select v-model="caseForm.case_type" class="select select-bordered" required>
              <option value="" disabled>Select type</option>
              <option v-for="(label, key) in caseTypeLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Description</span></label>
            <textarea v-model="caseForm.description" class="textarea textarea-bordered h-24" required></textarea>
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="showNewCaseModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Case</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showNewCaseModal = false">close</button>
      </form>
    </dialog>

    <!-- View Case Modal -->
    <dialog class="modal" :class="{ 'modal-open': showViewModal && selectedCase }">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">Case Details</h3>
        <div v-if="selectedCase" class="space-y-3">
          <div><strong>Employee:</strong> {{ selectedCase.employee?.first_name }} {{ selectedCase.employee?.last_name }}</div>
          <div><strong>Type:</strong> {{ caseTypeLabels[selectedCase.case_type] || selectedCase.case_type }}</div>
          <div><strong>Status:</strong>
            <span class="badge badge-sm" :class="statusColors[selectedCase.status]">{{ selectedCase.status?.replace(/_/g, ' ') }}</span>
          </div>
          <div><strong>Description:</strong><p class="mt-1">{{ selectedCase.description }}</p></div>
          <div v-if="selectedCase.decision"><strong>Decision:</strong><p class="mt-1">{{ selectedCase.decision }}</p></div>
          <div v-if="selectedCase.closedBy"><strong>Closed by:</strong> {{ selectedCase.closedBy?.first_name }} {{ selectedCase.closedBy?.last_name }}</div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showViewModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showViewModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
