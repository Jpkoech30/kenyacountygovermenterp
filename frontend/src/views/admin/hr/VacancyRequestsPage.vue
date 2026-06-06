<script setup>
import { ref, onMounted, computed } from 'vue';
import { useHrStore } from '@/stores/hr';
import { useAuthStore } from '@/stores/auth';

const hrStore = useHrStore();
const authStore = useAuthStore();

const showCreateModal = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const selectedRequest = ref(null);
const approvalNotes = ref('');
const rejectionReason = ref('');
const form = ref({ vacancy_id: null, approval_notes: '' });

const isBoardOrAdmin = computed(() =>
  ['board_member', 'admin'].some((r) => authStore.user?.roles?.includes(r))
);

const pendingCount = computed(() =>
  hrStore.vacancyRequests.filter((r) => r.status === 'pending').length
);

const approvedCount = computed(() =>
  hrStore.vacancyRequests.filter((r) => r.status === 'approved').length
);

const rejectedCount = computed(() =>
  hrStore.vacancyRequests.filter((r) => r.status === 'rejected').length
);

const statusBadge = (status) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' };
  return `badge ${map[status] || 'badge-ghost'}`;
};

function openApprove(req) {
  selectedRequest.value = req;
  approvalNotes.value = '';
  showApproveModal.value = true;
}

function openReject(req) {
  selectedRequest.value = req;
  rejectionReason.value = '';
  showRejectModal.value = true;
}

async function handleApprove() {
  await hrStore.approveVacancyRequest(selectedRequest.value.id, approvalNotes.value);
  showApproveModal.value = false;
  selectedRequest.value = null;
}

async function handleReject() {
  await hrStore.rejectVacancyRequest(selectedRequest.value.id, rejectionReason.value);
  showRejectModal.value = false;
  selectedRequest.value = null;
}

async function handleCreate() {
  await hrStore.createVacancyRequest(form.value);
  showCreateModal.value = false;
  form.value = { vacancy_id: null, approval_notes: '' };
}

onMounted(async () => {
  await Promise.all([
    hrStore.fetchVacancyRequests(),
    hrStore.fetchVacancies({ status: 'draft' }),
  ]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Vacancy Requests</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Manage approval workflow for publishing vacancies
        </p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Request
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Pending</div>
        <div class="stat-value text-warning">{{ pendingCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Approved</div>
        <div class="stat-value text-success">{{ approvedCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Rejected</div>
        <div class="stat-value text-error">{{ rejectedCount }}</div>
      </div>
    </div>

    <!-- Requests Table -->
    <div class="card bg-base-100 shadow-sm border">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Vacancy</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in hrStore.vacancyRequests" :key="req.id">
                <td>
                  <div class="font-medium">{{ req.vacancy?.title || 'N/A' }}</div>
                  <div class="text-xs text-base-content/60">{{ req.vacancy?.employment_type }}</div>
                </td>
                <td>{{ req.requester?.name || 'N/A' }}</td>
                <td><span :class="statusBadge(req.status)">{{ req.status }}</span></td>
                <td class="text-sm">{{ new Date(req.createdAt).toLocaleDateString() }}</td>
                <td class="text-right">
                  <div class="flex justify-end gap-1" v-if="req.status === 'pending' && isBoardOrAdmin">
                    <button class="btn btn-xs btn-success" @click="openApprove(req)">Approve</button>
                    <button class="btn btn-xs btn-error" @click="openReject(req)">Reject</button>
                  </div>
                  <span v-else class="text-xs text-base-content/50">{{ req.approval_notes || '—' }}</span>
                </td>
              </tr>
              <tr v-if="hrStore.vacancyRequests.length === 0">
                <td colspan="5" class="text-center py-8 text-base-content/50">No vacancy requests yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <dialog :class="['modal', showCreateModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">New Vacancy Request</h3>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Vacancy <span class="text-error">*</span></span></label>
            <select v-model="form.vacancy_id" class="select select-bordered" required>
              <option value="" disabled>Select a draft vacancy</option>
              <option v-for="v in hrStore.vacancies" :key="v.id" :value="v.id">{{ v.title }} ({{ v.employment_type }})</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Approval Notes</span>
              <span class="label-text-alt tooltip" data-tip="Optional context for the approving authority">ⓘ</span>
            </label>
            <textarea v-model="form.approval_notes" class="textarea textarea-bordered" rows="3" placeholder="Why is this vacancy needed?"></textarea>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showCreateModal = false"><button>close</button></form>
    </dialog>

    <!-- Approve Modal -->
    <dialog :class="['modal', showApproveModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Approve Request</h3>
        <p class="mb-2">Approve request for <strong>{{ selectedRequest?.vacancy?.title }}</strong>?</p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Approval Notes</span>
          </label>
          <textarea v-model="approvalNotes" class="textarea textarea-bordered" rows="2" placeholder="Optional notes"></textarea>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showApproveModal = false">Cancel</button>
          <button class="btn btn-success" @click="handleApprove">Confirm Approve</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showApproveModal = false"><button>close</button></form>
    </dialog>

    <!-- Reject Modal -->
    <dialog :class="['modal', showRejectModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Reject Request</h3>
        <p class="mb-2">Reject request for <strong>{{ selectedRequest?.vacancy?.title }}</strong>?</p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Reason <span class="text-error">*</span></span>
          </label>
          <textarea v-model="rejectionReason" class="textarea textarea-bordered" rows="2" placeholder="Reason for rejection" required></textarea>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showRejectModal = false">Cancel</button>
          <button class="btn btn-error" @click="handleReject">Confirm Reject</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showRejectModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>
