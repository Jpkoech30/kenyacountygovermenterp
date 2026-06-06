<script setup>
/**
 * EmployeeDetailPage.vue
 * Detailed employee view with tabs for different sections.
 * HR Officer can view/edit employee details, employment history, leave, etc.
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHrStore } from '../../../stores/hr';
import EmploymentHistoryForm from '../../../components/hr/EmploymentHistoryForm.vue';

const route = useRoute();
const router = useRouter();
const hrStore = useHrStore();

const activeTab = ref('details');
const showHistoryForm = ref(false);
const actionLoading = ref(false);
const actionError = ref('');

const employeeId = computed(() => parseInt(route.params.id));

// ── Status change modal state ──
const showStatusModal = ref(false);
const statusActionType = ref(''); // 'suspend' | 'terminate' | 'retire'
const statusReason = ref('');

onMounted(async () => {
  await hrStore.fetchEmployee(employeeId.value);
});

const statusBadgeClass = (status) => {
  const map = {
    active: 'badge-success',
    on_leave: 'badge-warning',
    suspended: 'badge-error',
    terminated: 'badge-neutral',
    retired: 'badge-ghost',
  };
  return map[status] || 'badge-ghost';
};

const tabs = ['details', 'history', 'leave', 'performance', 'disciplinary'];

function openStatusModal(type) {
  statusActionType.value = type;
  statusReason.value = '';
  showStatusModal.value = true;
}

const statusModalConfig = computed(() => {
  const configs = {
    suspend: { title: 'Suspend Employee', label: 'Suspension Reason', btnClass: 'btn-warning', btnLabel: 'Suspend' },
    terminate: { title: 'Terminate Employee', label: 'Termination Reason', btnClass: 'btn-error', btnLabel: 'Terminate' },
    retire: { title: 'Retire Employee', label: 'Retirement Reason', btnClass: 'btn-neutral', btnLabel: 'Retire' },
  };
  return configs[statusActionType.value] || configs.suspend;
});

async function confirmStatusChange() {
  if (!statusReason.value.trim()) return;
  actionLoading.value = true;
  actionError.value = '';
  showStatusModal.value = false;
  try {
    const type = statusActionType.value;
    if (type === 'suspend') await hrStore.suspendEmployee(employeeId.value, statusReason.value);
    else if (type === 'terminate') await hrStore.terminateEmployee(employeeId.value, statusReason.value);
    else if (type === 'retire') await hrStore.retireEmployee(employeeId.value, statusReason.value);
    await hrStore.fetchEmployee(employeeId.value);
  } catch (err) {
    actionError.value = err.response?.data?.error || `Failed to ${statusActionType.value}`;
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="hrStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="hrStore.currentEmployee">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold">
              {{ hrStore.currentEmployee.first_name }} {{ hrStore.currentEmployee.last_name }}
            </h1>
            <span class="badge" :class="statusBadgeClass(hrStore.currentEmployee.status)">
              {{ hrStore.currentEmployee.status }}
            </span>
          </div>
          <p class="text-base-content/60 mt-1">
            {{ hrStore.currentEmployee.position?.title || 'No position' }} •
            {{ hrStore.currentEmployee.department?.name || 'No department' }}
          </p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-outline" @click="router.push('/admin/hr/employees')">Back</button>
          <button class="btn btn-sm btn-outline btn-primary" @click="router.push(`/admin/hr/employees/${employeeId}/edit`)">Edit</button>
          <button class="btn btn-sm btn-warning" @click="openStatusModal('suspend')" :disabled="actionLoading">Suspend</button>
          <button class="btn btn-sm btn-error" @click="openStatusModal('terminate')" :disabled="actionLoading">Terminate</button>
          <button class="btn btn-sm btn-neutral" @click="openStatusModal('retire')" :disabled="actionLoading">Retire</button>
        </div>
      </div>

      <div v-if="actionError" class="alert alert-error shadow-lg">
        <span>{{ actionError }}</span>
      </div>

      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-bordered">
        <a v-for="tab in tabs" :key="tab" role="tab" class="tab"
          :class="{ 'tab-active': activeTab === tab }" @click="activeTab = tab">
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </a>
      </div>

      <!-- Details Tab -->
      <div v-if="activeTab === 'details'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-base-100 shadow-sm col-span-2">
          <div class="card-body">
            <h3 class="card-title">Personal Information</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-semibold">National ID:</span> {{ hrStore.currentEmployee.national_id }}</div>
              <div><span class="font-semibold">Date of Birth:</span> {{ hrStore.currentEmployee.birth_date || '-' }}</div>
              <div><span class="font-semibold">Gender:</span> {{ hrStore.currentEmployee.gender || '-' }}</div>
              <div><span class="font-semibold">Marital Status:</span> {{ hrStore.currentEmployee.marital_status || '-' }}</div>
              <div><span class="font-semibold">Phone:</span> {{ hrStore.currentEmployee.phone || '-' }}</div>
              <div><span class="font-semibold">Email:</span> {{ hrStore.currentEmployee.email || '-' }}</div>
            </div>
            <div class="divider"></div>
            <h3 class="card-title">Employment Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-semibold">Type:</span> {{ hrStore.currentEmployee.employment_type }}</div>
              <div><span class="font-semibold">Start Date:</span> {{ hrStore.currentEmployee.contract_start_date }}</div>
              <div><span class="font-semibold">End Date:</span> {{ hrStore.currentEmployee.contract_end_date || 'N/A (Permanent)' }}</div>
              <div><span class="font-semibold">Supervisor:</span> {{ hrStore.currentEmployee.supervisor?.first_name }} {{ hrStore.currentEmployee.supervisor?.last_name || 'None' }}</div>
            </div>
            <div class="divider"></div>
            <h3 class="card-title">Statutory</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-semibold">KRA PIN:</span> {{ hrStore.currentEmployee.kra_pin || '-' }}</div>
              <div><span class="font-semibold">NSSF:</span> {{ hrStore.currentEmployee.nssf_no || '-' }}</div>
              <div><span class="font-semibold">NHIF:</span> {{ hrStore.currentEmployee.nhif_no || '-' }}</div>
              <div><span class="font-semibold">Bank Account:</span> {{ hrStore.currentEmployee.bank_account || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- Leave Balance Summary -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h3 class="card-title">Leave Balances</h3>
            <div v-if="hrStore.currentEmployee.leaveBalances?.length">
              <div v-for="bal in hrStore.currentEmployee.leaveBalances" :key="bal.id" class="mb-3">
                <p class="text-sm font-semibold">{{ bal.year }}</p>
                <div class="stats stats-vertical shadow">
                  <div class="stat py-2">
                    <div class="stat-title text-xs">Entitled</div>
                    <div class="stat-value text-sm">{{ bal.days_entitled }}</div>
                  </div>
                  <div class="stat py-2">
                    <div class="stat-title text-xs">Taken</div>
                    <div class="stat-value text-sm text-warning">{{ bal.days_taken }}</div>
                  </div>
                  <div class="stat py-2">
                    <div class="stat-title text-xs">Remaining</div>
                    <div class="stat-value text-sm text-success">{{ bal.days_remaining }}</div>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/60">No leave balances</p>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Employment History</h3>
          <button class="btn btn-sm btn-primary" @click="showHistoryForm = true">+ Add Entry</button>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Position</th>
                <th>Department</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in hrStore.currentEmployee.employmentHistory" :key="h.id">
                <td>{{ h.effective_from }}</td>
                <td>{{ h.effective_to || 'Current' }}</td>
                <td>{{ h.position?.title || '-' }}</td>
                <td>{{ h.department?.name || '-' }}</td>
                <td><span class="badge badge-ghost badge-sm">{{ h.change_reason }}</span></td>
                <td>{{ h.createdBy?.first_name }} {{ h.createdBy?.last_name || '-' }}</td>
              </tr>
              <tr v-if="!hrStore.currentEmployee.employmentHistory?.length">
                <td colspan="6" class="text-center py-4 text-base-content/60">No history records</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Leave Tab -->
      <div v-if="activeTab === 'leave'">
        <h3 class="text-lg font-semibold mb-4">Leave Requests</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lr in hrStore.currentEmployee.leaveRequests || []" :key="lr.id">
                <td><span class="badge badge-ghost badge-sm">{{ lr.leave_type }}</span></td>
                <td>{{ lr.start_date }}</td>
                <td>{{ lr.end_date }}</td>
                <td>{{ lr.total_days }}</td>
                <td>
                  <span class="badge badge-sm" :class="{
                    'badge-warning': lr.status === 'pending',
                    'badge-success': lr.status === 'approved',
                    'badge-error': lr.status === 'rejected',
                  }">{{ lr.status }}</span>
                </td>
                <td class="max-w-xs truncate">{{ lr.reason || '-' }}</td>
              </tr>
              <tr v-if="!hrStore.currentEmployee.leaveRequests?.length">
                <td colspan="6" class="text-center py-4 text-base-content/60">No leave requests</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Performance Tab -->
      <div v-if="activeTab === 'performance'">
        <h3 class="text-lg font-semibold mb-4">Performance Reviews</h3>
        <div v-if="!hrStore.currentEmployee.performanceReviews?.length" class="text-center py-8 text-base-content/60">
          No performance reviews yet
        </div>
      </div>

      <!-- Disciplinary Tab -->
      <div v-if="activeTab === 'disciplinary'">
        <h3 class="text-lg font-semibold mb-4">Disciplinary Cases</h3>
        <div v-if="!hrStore.currentEmployee.disciplinaryCases?.length" class="text-center py-8 text-base-content/60">
          No disciplinary cases
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <p class="text-lg text-base-content/60">Employee not found</p>
      <button class="btn btn-primary mt-4" @click="router.push('/admin/hr/employees')">Back to Employees</button>
    </div>

    <!-- Employment History Modal -->
    <EmploymentHistoryForm
      v-if="showHistoryForm"
      :employee-id="employeeId"
      :current-position="hrStore.currentEmployee?.position"
      :current-department="hrStore.currentEmployee?.department"
      @saved="showHistoryForm = false; hrStore.fetchEmployee(employeeId)"
      @close="showHistoryForm = false"
    />

    <!-- Status Change Modal -->
    <dialog v-if="showStatusModal" class="modal modal-open" @click.self="showStatusModal = false">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ statusModalConfig.title }}</h3>
        <p class="py-2 text-sm text-base-content/70">
          This will change the employee's status to <strong>{{ statusActionType }}d</strong>.
        </p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ statusModalConfig.label }}</span>
          </label>
          <textarea
            v-model="statusReason"
            class="textarea textarea-bordered"
            rows="3"
            placeholder="Enter reason..."
          ></textarea>
        </div>
        <div v-if="actionError" class="alert alert-error mt-3 shadow-lg">
          <span>{{ actionError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn btn-sm" @click="showStatusModal = false">Cancel</button>
          <button
            class="btn btn-sm"
            :class="statusModalConfig.btnClass"
            :disabled="!statusReason.trim() || actionLoading"
            @click="confirmStatusChange"
          >
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            {{ statusModalConfig.btnLabel }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showStatusModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
