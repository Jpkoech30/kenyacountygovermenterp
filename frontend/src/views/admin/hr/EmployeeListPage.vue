<script setup>
/**
 * EmployeeListPage.vue
 * HR Officer view: list all employees with search, filter, and pagination.
 * DaisyUI only - no custom CSS.
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useHrStore } from '../../../stores/hr';

const router = useRouter();
const hrStore = useHrStore();

const search = ref('');
const statusFilter = ref('');
const departmentFilter = ref('');
const currentPage = ref(1);

const departments = ref([]);

// ── Quick-status modal state ──
const showQuickStatusModal = ref(false);
const quickStatusEmployee = ref(null);
const quickStatusAction = ref('');
const quickStatusReason = ref('');
const quickStatusLoading = ref(false);
const quickStatusError = ref('');

onMounted(async () => {
  await hrStore.fetchEmployees({ page: currentPage.value, limit: 20 });
  try {
    const { default: api } = await import('../../../api/axios');
    const res = await api.get('/api/departments');
    departments.value = res.data.departments || [];
  } catch (e) {
    console.error('Failed to load departments', e);
  }
});

watch([search, statusFilter, departmentFilter, currentPage], () => {
  const params = { page: currentPage.value, limit: 20 };
  if (search.value) params.search = search.value;
  if (statusFilter.value) params.status = statusFilter.value;
  if (departmentFilter.value) params.department_id = departmentFilter.value;
  hrStore.fetchEmployees(params);
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

function viewEmployee(id) {
  router.push(`/admin/hr/employees/${id}`);
}

function editEmployee(id) {
  router.push(`/admin/hr/employees/${id}/edit`);
}

function createEmployee() {
  router.push('/admin/hr/employees/new');
}

function openQuickStatus(emp, action) {
  quickStatusEmployee.value = emp;
  quickStatusAction.value = action;
  quickStatusReason.value = '';
  quickStatusError.value = '';
  showQuickStatusModal.value = true;
}

const quickStatusConfig = computed(() => {
  const configs = {
    suspend: { title: 'Suspend Employee', btnClass: 'btn-warning', btnLabel: 'Suspend' },
    terminate: { title: 'Terminate Employee', btnClass: 'btn-error', btnLabel: 'Terminate' },
    retire: { title: 'Retire Employee', btnClass: 'btn-neutral', btnLabel: 'Retire' },
  };
  return configs[quickStatusAction.value] || configs.suspend;
});

async function confirmQuickStatus() {
  if (!quickStatusReason.value.trim() || !quickStatusEmployee.value) return;
  quickStatusLoading.value = true;
  quickStatusError.value = '';
  try {
    const id = quickStatusEmployee.value.id;
    const reason = quickStatusReason.value;
    const action = quickStatusAction.value;
    if (action === 'suspend') await hrStore.suspendEmployee(id, reason);
    else if (action === 'terminate') await hrStore.terminateEmployee(id, reason);
    else if (action === 'retire') await hrStore.retireEmployee(id, reason);
    showQuickStatusModal.value = false;
    // Re-fetch current page
    const params = { page: currentPage.value, limit: 20 };
    if (search.value) params.search = search.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (departmentFilter.value) params.department_id = departmentFilter.value;
    await hrStore.fetchEmployees(params);
  } catch (err) {
    quickStatusError.value = err.response?.data?.error || `Failed to ${quickStatusAction.value}`;
  } finally {
    quickStatusLoading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Employees</h1>
        <p class="text-base-content/60">Manage county employees</p>
      </div>
      <button class="btn btn-primary" @click="createEmployee">
        + Add Employee
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <div class="form-control flex-1 min-w-[200px]">
        <input v-model="search" type="text" placeholder="Search by name, ID, or email..."
          class="input input-bordered input-sm" />
      </div>
      <select v-model="statusFilter" class="select select-bordered select-sm">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="on_leave">On Leave</option>
        <option value="suspended">Suspended</option>
        <option value="terminated">Terminated</option>
        <option value="retired">Retired</option>
      </select>
      <select v-model="departmentFilter" class="select select-bordered select-sm">
        <option value="">All Departments</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="hrStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Employee Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>National ID</th>
            <th>Department</th>
            <th>Position</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in hrStore.employees" :key="emp.id">
            <td>
              <div class="font-medium">{{ emp.first_name }} {{ emp.last_name }}</div>
              <div class="text-xs text-base-content/60">{{ emp.email }}</div>
            </td>
            <td>{{ emp.national_id }}</td>
            <td>{{ emp.department?.name || '-' }}</td>
            <td>{{ emp.position?.title || '-' }}</td>
            <td>
              <span class="badge badge-ghost badge-sm">{{ emp.employment_type }}</span>
            </td>
            <td>
              <span class="badge badge-sm" :class="statusBadgeClass(emp.status)">{{ emp.status }}</span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-xs" @click="viewEmployee(emp.id)">View</button>
                <button class="btn btn-ghost btn-xs" @click="editEmployee(emp.id)">Edit</button>
                <div class="dropdown dropdown-end">
                  <label tabindex="0" class="btn btn-ghost btn-xs">Status ▾</label>
                  <ul tabindex="0" class="dropdown-content menu menu-xs p-1 shadow bg-base-100 rounded-box w-32 border border-base-300 z-10">
                    <li v-if="emp.status !== 'suspended'"><a @click="openQuickStatus(emp, 'suspend')" class="text-warning">Suspend</a></li>
                    <li v-if="emp.status !== 'terminated'"><a @click="openQuickStatus(emp, 'terminate')" class="text-error">Terminate</a></li>
                    <li v-if="emp.status !== 'retired'"><a @click="openQuickStatus(emp, 'retire')" class="text-neutral">Retire</a></li>
                  </ul>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="hrStore.employees.length === 0">
            <td colspan="7" class="text-center py-8 text-base-content/60">No employees found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="hrStore.pagination.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="currentPage <= 1"
          @click="currentPage = currentPage - 1">«</button>
        <button class="join-item btn btn-sm" v-for="p in hrStore.pagination.totalPages" :key="p"
          :class="{ 'btn-active': p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="currentPage >= hrStore.pagination.totalPages"
          @click="currentPage = currentPage + 1">»</button>
      </div>
    </div>

    <!-- Quick Status Change Modal -->
    <dialog v-if="showQuickStatusModal" class="modal modal-open" @click.self="showQuickStatusModal = false">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ quickStatusConfig.title }}</h3>
        <p class="py-2 text-sm text-base-content/70">
          Change status of <strong>{{ quickStatusEmployee?.first_name }} {{ quickStatusEmployee?.last_name }}</strong>
          to <strong>{{ quickStatusAction }}d</strong>.
        </p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Reason</span>
          </label>
          <textarea
            v-model="quickStatusReason"
            class="textarea textarea-bordered"
            rows="3"
            placeholder="Enter reason..."
          ></textarea>
        </div>
        <div v-if="quickStatusError" class="alert alert-error mt-3 shadow-lg">
          <span>{{ quickStatusError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn btn-sm" @click="showQuickStatusModal = false">Cancel</button>
          <button
            class="btn btn-sm"
            :class="quickStatusConfig.btnClass"
            :disabled="!quickStatusReason.trim() || quickStatusLoading"
            @click="confirmQuickStatus"
          >
            <span v-if="quickStatusLoading" class="loading loading-spinner loading-xs"></span>
            {{ quickStatusConfig.btnLabel }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showQuickStatusModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
