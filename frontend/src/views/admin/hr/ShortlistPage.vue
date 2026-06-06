<script setup>
import { ref, onMounted, computed } from 'vue';
import { useHrStore } from '@/stores/hr';

const hrStore = useHrStore();

const selectedVacancyId = ref('');
const showScoreModal = ref(false);
const scoringForm = ref({ application_id: null, score: 50, comments: '' });

const filteredApplications = computed(() => {
  if (!selectedVacancyId.value) return [];
  return hrStore.applications.filter((a) => a.vacancy_id === Number(selectedVacancyId.value));
});

const shortlistedCount = computed(() =>
  filteredApplications.value.filter((a) => a.status === 'shortlisted').length
);

const rejectedCount = computed(() =>
  filteredApplications.value.filter((a) => a.status === 'rejected').length
);

const pendingCount = computed(() =>
  filteredApplications.value.filter((a) => a.status === 'submitted').length
);

function openScore(application) {
  scoringForm.value = { application_id: application.id, score: 50, comments: '' };
  showScoreModal.value = true;
}

async function handleScore() {
  await hrStore.shortlistApplication(scoringForm.value.application_id, {
    score: scoringForm.value.score,
    comments: scoringForm.value.comments,
    vacancy_id: selectedVacancyId.value,
  });
  showScoreModal.value = false;
}

async function handleFinalize() {
  await hrStore.finalizeShortlist(selectedVacancyId.value);
  await hrStore.fetchApplications({ vacancy_id: selectedVacancyId.value });
}

const statusBadge = (status) => {
  const map = {
    submitted: 'badge-info',
    shortlisted: 'badge-success',
    rejected: 'badge-error',
    interviewed: 'badge-warning',
    offered: 'badge-primary',
    hired: 'badge-accent',
  };
  return `badge ${map[status] || 'badge-ghost'}`;
};

onMounted(async () => {
  await hrStore.fetchVacancies({ status: 'published' });
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Shortlisting</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Score and shortlist applicants for interview
        </p>
      </div>
      <div class="form-control w-full sm:w-72">
        <select v-model="selectedVacancyId" class="select select-bordered" @change="hrStore.fetchApplications({ vacancy_id: selectedVacancyId })">
          <option value="">Select a vacancy...</option>
          <option v-for="v in hrStore.vacancies" :key="v.id" :value="v.id">{{ v.title }}</option>
        </select>
      </div>
    </div>

    <!-- Stat Cards (visible when vacancy selected) -->
    <div v-if="selectedVacancyId" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <div class="stat-title">Pending Review</div>
        <div class="stat-value text-info">{{ pendingCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Shortlisted</div>
        <div class="stat-value text-success">{{ shortlistedCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Eliminated</div>
        <div class="stat-value text-error">{{ rejectedCount }}</div>
      </div>
    </div>

    <!-- Applications Table -->
    <div v-if="selectedVacancyId" class="card bg-base-100 shadow-sm border">
      <div class="card-body p-0">
        <div class="flex items-center justify-between px-6 pt-4 pb-2">
          <h3 class="font-semibold">Applications ({{ filteredApplications.length }})</h3>
          <button class="btn btn-sm btn-primary" @click="handleFinalize" :disabled="pendingCount > 0">
            Finalize Shortlist
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Score</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in filteredApplications" :key="app.id">
                <td>
                  <div class="font-medium">{{ app.applicant_name }}</div>
                </td>
                <td>
                  <div class="text-sm">{{ app.email }}</div>
                  <div class="text-xs text-base-content/60">{{ app.phone }}</div>
                </td>
                <td><span :class="statusBadge(app.status)">{{ app.status }}</span></td>
                <td>
                  <span v-if="app.shortlisting_score !== null" class="font-mono">{{ app.shortlisting_score }}</span>
                  <span v-else class="text-base-content/40">—</span>
                </td>
                <td class="text-right">
                  <button
                    v-if="app.status === 'submitted'"
                    class="btn btn-xs btn-outline btn-info"
                    @click="openScore(app)"
                  >
                    Score
                  </button>
                  <span v-else-if="app.shortlisting_comments" class="text-xs tooltip" :data-tip="app.shortlisting_comments">
                    {{ app.elimination_reason ? 'Eliminated' : 'Scored' }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredApplications.length === 0">
                <td colspan="5" class="text-center py-8 text-base-content/50">No applications for this vacancy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card bg-base-100 shadow-sm border">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <p class="text-base-content/50">Select a vacancy above to view and score applications</p>
      </div>
    </div>

    <!-- Score Modal -->
    <dialog :class="['modal', showScoreModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Score Application</h3>
        <form @submit.prevent="handleScore" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Score (0–100) <span class="text-error">*</span></span>
              <span class="label-text-alt tooltip" data-tip="Score ≥ 50 = Shortlisted, Score < 50 = Rejected">ⓘ</span>
            </label>
            <input type="range" v-model.number="scoringForm.score" min="0" max="100" class="range range-sm range-primary" />
            <div class="flex justify-between text-xs mt-1">
              <span>0</span>
              <span class="font-bold">{{ scoringForm.score }}</span>
              <span>100</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Comments</span></label>
            <textarea v-model="scoringForm.comments" class="textarea textarea-bordered" rows="2" placeholder="Qualification assessment notes"></textarea>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showScoreModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Score</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showScoreModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>
