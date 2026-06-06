<script setup>
/**
 * LeavePage.vue
 * Leave management page for HR officers and supervisors.
 * Shows all leave requests with approve/reject actions.
 */
import { ref, onMounted, computed } from 'vue';
import { useHrStore } from '../../../stores/hr';

const hrStore = useHrStore();
const activeTab = ref('all');
const rejectModal = ref(false);
const selectedLeave = ref(null);
const rejectReason = ref('');

onMounted(async () => {
  await hrStore.fetchTeamLeaveRequests();
});

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return hrStore.teamLeaveRequests;
  return hrStore.teamLeaveRequests.filter((lr) => lr.status === activeTab.value);
});

async function handleApprove(id) {
  try {
    await hrStore.approveLeave(id);
    await hrStore.fetchTeamLeaveRequests();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to approve');
  }
}

function openRejectModal(leave) {
  selectedLeave.value = leave;
  rejectReason.value = '';
  rejectModal.value = true;
}

async function handleReject() {
  if (!selectedLeave.value) return;
  try {
    await hrStore.rejectLeave(selectedLeave.value.id, rejectReason.value);
    rejectModal.value = false;
    selectedLeave.value = null;
    await hrStore.fetchTeamLeaveRequests();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to reject');
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Leave Management</h1>
      <p class="text-base-content/60">Approve or reject leave requests from your team</p>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-bordered">
      <a v-for="tab in ['all', 'pending', 'approved', 'rejected']" :key="tab" role="tab" class="tab"
        :class="{ 'tab-active': activeTab === tab }" @click="activeTab = tab">
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </a>
    </div>

    <!-- Loading -->
    <div v-if="hrStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Leave Requests Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Days</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lr in filteredRequests" :key="lr.id">
            <td>{{ lr.employee?.first_name }} {{ lr.employee?.last_name }}</td>
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
            <td>
              <div v-if="lr.status === 'pending'" class="flex gap-1">
                <button class="btn btn-success btn-xs" @click="handleApprove(lr.id)">Approve</button>
                <button class="btn btn-error btn-xs" @click="openRejectModal(lr)">Reject</button>
              </div>
              <span v-else class="text-xs text-base-content/60">-</span>
            </td>
          </tr>
          <tr v-if="filteredRequests.length === 0">
            <td colspan="8" class="text-center py-8 text-base-content/60">No leave requests found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Reject Leave Request</h3>
        <p class="mb-2 text-sm">
          {{ selectedLeave?.employee?.first_name }} {{ selectedLeave?.employee?.last_name }} -
          {{ selectedLeave?.leave_type }} ({{ selectedLeave?.total_days }} days)
        </p>
        <div class="form-control">
          <label class="label"><span class="label-text">Reason for rejection *</span></label>
          <textarea v-model="rejectReason" class="textarea textarea-bordered" rows="3" required></textarea>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="rejectModal = false">Cancel</button>
          <button class="btn btn-error" @click="handleReject" :disabled="!rejectReason">Reject</button>
        </div>
      </div>
    </div>
  </div>
</template>
