<script setup>
import { ref, onMounted, computed } from 'vue';
import { useHrStore } from '@/stores/hr';

const hrStore = useHrStore();

const showGenerateModal = ref(false);
const selectedApplication = ref(null);
const applicationsForLetter = ref([]);

const draftCount = computed(() =>
  hrStore.appointmentLetters.filter((l) => l.status === 'draft').length
);

const issuedCount = computed(() =>
  hrStore.appointmentLetters.filter((l) => l.status === 'issued').length
);

const signedCount = computed(() =>
  hrStore.appointmentLetters.filter((l) => l.status === 'signed').length
);

const statusBadge = (status) => {
  const map = { draft: 'badge-warning', issued: 'badge-info', signed: 'badge-success' };
  return `badge ${map[status] || 'badge-ghost'}`;
};

function openGenerate(application) {
  selectedApplication.value = application;
  showGenerateModal.value = true;
}

async function handleGenerate() {
  await hrStore.generateAppointmentLetter(selectedApplication.value.id);
  showGenerateModal.value = false;
}

async function handleIssue(letterId) {
  await hrStore.issueAppointmentLetter(letterId);
}

function getPdfUrl(letter) {
  return letter.pdf_path ? `${import.meta.env.VITE_API_URL || ''}${letter.pdf_path}` : null;
}

onMounted(async () => {
  await Promise.all([
    hrStore.fetchAppointmentLetters(),
    hrStore.fetchApplications({ status: 'offered' }),
  ]);
  applicationsForLetter.value = hrStore.applications.filter((a) => a.status === 'offered');
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Appointment Letters</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Generate, issue, and manage appointment letters
        </p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div class="stat-title">Draft</div>
        <div class="stat-value text-warning">{{ draftCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"/></svg>
        </div>
        <div class="stat-title">Issued</div>
        <div class="stat-value text-info">{{ issuedCount }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm border">
        <div class="stat-figure text-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-title">Signed</div>
        <div class="stat-value text-success">{{ signedCount }}</div>
      </div>
    </div>

    <!-- Letters Table -->
    <div class="card bg-base-100 shadow-sm border">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Letter #</th>
                <th>Applicant</th>
                <th>Position</th>
                <th>Status</th>
                <th>Issued</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="letter in hrStore.appointmentLetters" :key="letter.id">
                <td>
                  <span class="font-mono text-sm">{{ letter.letter_number }}</span>
                </td>
                <td>{{ letter.application?.applicant_name || 'N/A' }}</td>
                <td>
                  <span class="text-sm">{{ letter.application?.vacancy?.title || 'N/A' }}</span>
                </td>
                <td><span :class="statusBadge(letter.status)">{{ letter.status }}</span></td>
                <td class="text-sm">{{ letter.issued_at ? new Date(letter.issued_at).toLocaleDateString() : '—' }}</td>
                <td class="text-right">
                  <div class="flex justify-end gap-1">
                    <a v-if="letter.pdf_path" :href="getPdfUrl(letter)" target="_blank" class="btn btn-xs btn-ghost">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      PDF
                    </a>
                    <button
                      v-if="letter.status === 'draft'"
                      class="btn btn-xs btn-primary"
                      @click="handleIssue(letter.id)"
                    >
                      Issue
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="hrStore.appointmentLetters.length === 0">
                <td colspan="6" class="text-center py-8 text-base-content/50">No appointment letters yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Generate Letter Section -->
    <div class="card bg-base-100 shadow-sm border" v-if="applicationsForLetter.length > 0">
      <div class="card-body">
        <h3 class="font-semibold mb-3">Generate New Letter</h3>
        <p class="text-sm text-base-content/60 mb-4">Applications with "Offered" status are ready for appointment letters.</p>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Vacancy</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in applicationsForLetter" :key="app.id">
                <td>{{ app.applicant_name }}</td>
                <td>{{ app.vacancy?.title || 'N/A' }}</td>
                <td class="text-right">
                  <button class="btn btn-xs btn-outline btn-primary" @click="openGenerate(app)">
                    Generate Letter
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Generate Modal -->
    <dialog :class="['modal', showGenerateModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Generate Appointment Letter</h3>
        <p>Generate appointment letter for <strong>{{ selectedApplication?.applicant_name }}</strong>?</p>
        <p class="text-sm text-base-content/60 mt-2">A PDF will be created and stored. The letter will be in draft status until issued.</p>
        <div class="modal-action">
          <button class="btn" @click="showGenerateModal = false">Cancel</button>
          <button class="btn btn-primary" @click="handleGenerate">Generate</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showGenerateModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>
