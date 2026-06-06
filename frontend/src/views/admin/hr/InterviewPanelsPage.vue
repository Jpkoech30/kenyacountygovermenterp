<script setup>
import { ref, onMounted, computed } from 'vue';
import { useHrStore } from '@/stores/hr';

const hrStore = useHrStore();

const showCreateModal = ref(false);
const showAddMemberModal = ref(false);
const selectedPanel = ref(null);
const form = ref({ vacancy_id: null, name: '', chairperson_id: null, members: [] });
const addMemberForm = ref({ user_id: null, role: 'member' });

const activePanels = computed(() =>
  hrStore.interviewPanels.filter((p) => p.status === 'active')
);

const statusBadge = (status) => {
  const map = { active: 'badge-success', dissolved: 'badge-error' };
  return `badge ${map[status] || 'badge-ghost'}`;
};

function openAddMember(panel) {
  selectedPanel.value = panel;
  addMemberForm.value = { user_id: null, role: 'member' };
  showAddMemberModal.value = true;
}

async function handleCreate() {
  await hrStore.createInterviewPanel(form.value);
  showCreateModal.value = false;
  form.value = { vacancy_id: null, name: '', chairperson_id: null, members: [] };
}

async function handleAddMember() {
  await hrStore.addPanelMember(selectedPanel.value.id, addMemberForm.value.user_id, addMemberForm.value.role);
  showAddMemberModal.value = false;
}

async function handleRemoveMember(memberId) {
  if (confirm('Remove this panel member?')) {
    await hrStore.removePanelMember(memberId);
  }
}

onMounted(async () => {
  await Promise.all([
    hrStore.fetchInterviewPanels(),
    hrStore.fetchVacancies({ status: 'published' }),
  ]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Interview Panels</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Create and manage interview panels for vacancies
        </p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Panel
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <div class="stat-title">Active Panels</div>
        <div class="stat-value text-success">{{ activePanels.length }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-base-content/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
        </div>
        <div class="stat-title">Total Panels</div>
        <div class="stat-value">{{ hrStore.interviewPanels.length }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-base-content/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        </div>
        <div class="stat-title">Dissolved</div>
        <div class="stat-value">{{ hrStore.interviewPanels.length - activePanels.length }}</div>
      </div>
    </div>

    <!-- Panels Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="panel in hrStore.interviewPanels" :key="panel.id" class="card bg-base-100 shadow-sm border">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="card-title text-base">{{ panel.name }}</h3>
              <p class="text-sm text-base-content/60">{{ panel.vacancy?.title }}</p>
            </div>
            <span :class="statusBadge(panel.status)">{{ panel.status }}</span>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-1">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">Chairperson:</span>
              <span>{{ panel.chairperson?.name || 'N/A' }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">Members:</span>
              <span>{{ panel.members?.length || 0 }}</span>
            </div>
          </div>

          <!-- Members List -->
          <div v-if="panel.members?.length" class="mt-2">
            <div v-for="m in panel.members" :key="m.id" class="flex items-center justify-between text-sm py-1 border-b border-base-200 last:border-0">
              <div class="flex items-center gap-2">
                <span>{{ m.member?.name || 'Unknown' }}</span>
                <span class="badge badge-ghost badge-xs">{{ m.role }}</span>
              </div>
              <button v-if="panel.status === 'active'" class="btn btn-ghost btn-xs text-error" @click="handleRemoveMember(m.id)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="card-actions justify-end mt-3" v-if="panel.status === 'active'">
            <button class="btn btn-xs btn-outline" @click="openAddMember(panel)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div v-if="hrStore.interviewPanels.length === 0" class="lg:col-span-2">
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p class="text-base-content/50">No interview panels created yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <dialog :class="['modal', showCreateModal && 'modal-open']">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">Create Interview Panel</h3>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Panel Name <span class="text-error">*</span></span></label>
            <input v-model="form.name" class="input input-bordered" placeholder="e.g., ICT Interview Panel 2025" required />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Vacancy <span class="text-error">*</span></span></label>
            <select v-model="form.vacancy_id" class="select select-bordered" required>
              <option value="" disabled>Select vacancy</option>
              <option v-for="v in hrStore.vacancies" :key="v.id" :value="v.id">{{ v.title }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Chairperson <span class="text-error">*</span></span></label>
            <input v-model="form.chairperson_id" type="number" class="input input-bordered" placeholder="User ID" required />
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Panel</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showCreateModal = false"><button>close</button></form>
    </dialog>

    <!-- Add Member Modal -->
    <dialog :class="['modal', showAddMemberModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Add Panel Member</h3>
        <p class="text-sm mb-4">Adding to: <strong>{{ selectedPanel?.name }}</strong></p>
        <form @submit.prevent="handleAddMember" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">User ID <span class="text-error">*</span></span></label>
            <input v-model="addMemberForm.user_id" type="number" class="input input-bordered" placeholder="User ID" required />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Role</span></label>
            <select v-model="addMemberForm.role" class="select select-bordered">
              <option value="member">Member</option>
              <option value="secretary">Secretary</option>
              <option value="chairperson">Chairperson</option>
            </select>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showAddMemberModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Member</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showAddMemberModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>
