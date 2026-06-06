<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHrStore } from '../../../stores/hr'
import { useAuthStore } from '../../../stores/auth'

const hrStore = useHrStore()
const authStore = useAuthStore()

const isHR = computed(() => ['hr_officer', 'admin'].includes(authStore.user?.role?.name))
const isBoard = computed(() => ['board_member', 'admin'].includes(authStore.user?.role?.name))

// --- Tab state ---
const activeTab = ref('vacancies') // vacancies | applications

// --- Vacancy form modal ---
const showVacancyModal = ref(false)
const editingVacancy = ref(null)
const vacancyForm = ref({
  title: '',
  department_id: '',
  position_id: '',
  employment_type: 'permanent',
  job_description: '',
  requirements: '',
  no_of_posts: 1,
  application_deadline: '',
  status: 'draft'
})

// --- Application detail modal ---
const showApplicationModal = ref(false)
const selectedApplication = ref(null)
const applicationStatusForm = ref({
  status: '',
  interview_score: null,
  rejection_reason: ''
})

// --- Approve appointment modal (board) ---
const showApproveModal = ref(false)
const approveApplicationId = ref(null)

// --- Reject modal ---
const showRejectModal = ref(false)
const rejectApplicationId = ref(null)
const rejectReason = ref('')

// --- Load departments & positions for forms ---
const departments = ref([])
const positions = ref([])

async function loadLookups() {
  try {
    const api = (await import('../../../api/axios')).default
    const [deptRes, posRes] = await Promise.all([
      api.get('/api/departments'),
      api.get('/api/positions')
    ])
    departments.value = deptRes.data.departments || deptRes.data
    positions.value = posRes.data.positions || posRes.data
  } catch (e) {
    console.error('Failed to load lookups', e)
  }
}

// --- Fetch data ---
async function loadData() {
  if (activeTab.value === 'vacancies') {
    await hrStore.fetchVacancies()
  } else {
    await hrStore.fetchApplications()
  }
}

onMounted(async () => {
  await loadLookups()
  await hrStore.fetchVacancies()
})

// --- Vacancy CRUD ---
function openNewVacancy() {
  editingVacancy.value = null
  vacancyForm.value = {
    title: '',
    department_id: '',
    position_id: '',
    employment_type: 'permanent',
    job_description: '',
    requirements: '',
    no_of_posts: 1,
    application_deadline: '',
    status: 'draft'
  }
  showVacancyModal.value = true
}

function openEditVacancy(vacancy) {
  editingVacancy.value = vacancy.id
  vacancyForm.value = {
    title: vacancy.title,
    department_id: vacancy.department_id,
    position_id: vacancy.position_id,
    employment_type: vacancy.employment_type,
    job_description: vacancy.job_description || '',
    requirements: vacancy.requirements || '',
    no_of_posts: vacancy.no_of_posts,
    application_deadline: vacancy.application_deadline ? vacancy.application_deadline.slice(0, 10) : '',
    status: vacancy.status
  }
  showVacancyModal.value = true
}

async function saveVacancy() {
  try {
    if (editingVacancy.value) {
      await hrStore.updateVacancy(editingVacancy.value, vacancyForm.value)
    } else {
      await hrStore.createVacancy(vacancyForm.value)
    }
    showVacancyModal.value = false
    await hrStore.fetchVacancies()
  } catch (e) {
    console.error('Failed to save vacancy', e)
  }
}

// --- Application actions ---
async function openApplicationDetail(application) {
  selectedApplication.value = null
  showApplicationModal.value = true
  await hrStore.fetchApplication(application.id)
  selectedApplication.value = hrStore.currentApplication
  applicationStatusForm.value = {
    status: selectedApplication.value?.status || '',
    interview_score: selectedApplication.value?.interview_score || null,
    rejection_reason: ''
  }
}

async function updateApplicationStatus() {
  if (!selectedApplication.value) return
  try {
    await hrStore.updateApplicationStatus(selectedApplication.value.id, {
      status: applicationStatusForm.value.status,
      interview_score: applicationStatusForm.value.interview_score,
      rejection_reason: applicationStatusForm.value.rejection_reason
    })
    showApplicationModal.value = false
    await hrStore.fetchApplications()
  } catch (e) {
    console.error('Failed to update status', e)
  }
}

function openApproveAppointment(applicationId) {
  approveApplicationId.value = applicationId
  showApproveModal.value = true
}

async function confirmApproveAppointment() {
  try {
    const api = (await import('../../../api/axios')).default
    await api.post(`/api/hr/applications/${approveApplicationId.value}/approve-appointment`)
    showApproveModal.value = false
    await hrStore.fetchApplications()
  } catch (e) {
    console.error('Failed to approve appointment', e)
  }
}

function openRejectApplication(applicationId) {
  rejectApplicationId.value = applicationId
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmRejectApplication() {
  try {
    await hrStore.updateApplicationStatus(rejectApplicationId.value, {
      status: 'rejected',
      rejection_reason: rejectReason.value
    })
    showRejectModal.value = false
    await hrStore.fetchApplications()
  } catch (e) {
    console.error('Failed to reject application', e)
  }
}

// --- Status badge helpers ---
const vacancyStatusClass = (status) => ({
  'badge-ghost': status === 'draft',
  'badge-info': status === 'published',
  'badge-warning': status === 'closed',
  'badge-success': status === 'filled'
})

const applicationStatusClass = (status) => ({
  'badge-ghost': status === 'submitted',
  'badge-info': status === 'shortlisted',
  'badge-warning': status === 'interviewed',
  'badge-primary': status === 'offered',
  'badge-success': status === 'hired',
  'badge-error': status === 'rejected'
})

const statusFlow = ['submitted', 'shortlisted', 'interviewed', 'offered', 'hired']

function nextStatuses(current) {
  const idx = statusFlow.indexOf(current)
  if (idx === -1) return []
  return statusFlow.slice(idx + 1)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Recruitment Management</h1>
        <p class="text-sm text-base-content/70">Manage job vacancies and citizen applications</p>
      </div>
      <div v-if="isHR" class="flex gap-2">
        <button v-if="activeTab === 'vacancies'" class="btn btn-primary btn-sm" @click="openNewVacancy">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Vacancy
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-bordered">
      <a class="tab tab-bordered" :class="{ 'tab-active': activeTab === 'vacancies' }" @click="activeTab = 'vacancies'; loadData()">Vacancies</a>
      <a class="tab tab-bordered" :class="{ 'tab-active': activeTab === 'applications' }" @click="activeTab = 'applications'; loadData()">Applications</a>
    </div>

    <!-- Loading -->
    <div v-if="hrStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- ==================== VACANCIES TAB ==================== -->
    <template v-else-if="activeTab === 'vacancies'">
      <div v-if="!hrStore.vacancies?.length" class="text-center py-12 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <p class="text-lg font-medium">No vacancies yet</p>
        <p v-if="isHR" class="text-sm mt-1">Click "New Vacancy" to create the first job posting</p>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="vacancy in hrStore.vacancies" :key="vacancy.id" class="card bg-base-100 shadow-sm border">
          <div class="card-body p-5">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate">{{ vacancy.title }}</h3>
                <p class="text-xs text-base-content/60 mt-0.5">
                  {{ vacancy.Department?.name || 'N/A' }}
                  <span v-if="vacancy.Position"> · {{ vacancy.Position.title }}</span>
                </p>
              </div>
              <span class="badge badge-sm ml-2" :class="vacancyStatusClass(vacancy.status)">{{ vacancy.status }}</span>
            </div>

            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/70 mt-3">
              <span>Type: {{ vacancy.employment_type }}</span>
              <span>Posts: {{ vacancy.no_of_posts }}</span>
              <span v-if="vacancy.application_deadline">Deadline: {{ new Date(vacancy.application_deadline).toLocaleDateString() }}</span>
            </div>

            <p v-if="vacancy.job_description" class="text-sm mt-2 line-clamp-2 text-base-content/80">{{ vacancy.job_description }}</p>

            <div v-if="vacancy.RecruitmentApplications?.length" class="mt-3 text-xs text-base-content/60">
              {{ vacancy.RecruitmentApplications.length }} application(s)
            </div>

            <div v-if="isHR" class="card-actions justify-end mt-3 pt-2 border-t">
              <button class="btn btn-ghost btn-xs" @click="openEditVacancy(vacancy)">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== APPLICATIONS TAB ==================== -->
    <template v-else>
      <div v-if="!hrStore.applications?.length" class="text-center py-12 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <p class="text-lg font-medium">No applications received</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Vacancy</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Score</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in hrStore.applications" :key="app.id">
              <td>
                <div class="font-medium">{{ app.applicant_name }}</div>
              </td>
              <td>
                <div class="text-sm">{{ app.RecruitmentVacancy?.title || 'N/A' }}</div>
              </td>
              <td>
                <div class="text-xs">{{ app.email }}</div>
                <div v-if="app.phone" class="text-xs text-base-content/60">{{ app.phone }}</div>
              </td>
              <td>
                <span class="badge badge-sm" :class="applicationStatusClass(app.status)">{{ app.status }}</span>
              </td>
              <td>
                <span v-if="app.interview_score != null" class="text-sm font-medium">{{ app.interview_score }}</span>
                <span v-else class="text-xs text-base-content/40">—</span>
              </td>
              <td class="text-sm text-base-content/70">{{ new Date(app.createdAt).toLocaleDateString() }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-xs" @click="openApplicationDetail(app)">View</button>
                  <button v-if="isBoard && app.status === 'offered'" class="btn btn-success btn-xs" @click="openApproveAppointment(app.id)">Approve</button>
                  <button v-if="isHR && app.status !== 'hired' && app.status !== 'rejected'" class="btn btn-error btn-xs" @click="openRejectApplication(app.id)">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ==================== VACANCY MODAL ==================== -->
    <div v-if="showVacancyModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">{{ editingVacancy ? 'Edit Vacancy' : 'New Vacancy' }}</h3>
        <form @submit.prevent="saveVacancy" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Job Title *</span></label>
            <input v-model="vacancyForm.title" class="input input-bordered input-sm" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Department *</span></label>
              <select v-model="vacancyForm.department_id" class="select select-bordered select-sm" required>
                <option value="">Select department</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Position *</span></label>
              <select v-model="vacancyForm.position_id" class="select select-bordered select-sm" required>
                <option value="">Select position</option>
                <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Employment Type</span></label>
              <select v-model="vacancyForm.employment_type" class="select select-bordered select-sm">
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="casual">Casual</option>
                <option value="intern">Intern</option>
                <option value="seconded">Seconded</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">No. of Posts</span></label>
              <input v-model.number="vacancyForm.no_of_posts" type="number" min="1" class="input input-bordered input-sm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Deadline *</span></label>
              <input v-model="vacancyForm.application_deadline" type="date" class="input input-bordered input-sm" required />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Job Description</span></label>
            <textarea v-model="vacancyForm.job_description" class="textarea textarea-bordered textarea-sm" rows="3"></textarea>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Requirements</span></label>
            <textarea v-model="vacancyForm.requirements" class="textarea textarea-bordered textarea-sm" rows="3"></textarea>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Status</span></label>
            <select v-model="vacancyForm.status" class="select select-bordered select-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="showVacancyModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="hrStore.loading">
              <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
              {{ editingVacancy ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="showVacancyModal = false"></div>
    </div>

    <!-- ==================== APPLICATION DETAIL MODAL ==================== -->
    <div v-if="showApplicationModal && selectedApplication" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Application Details</h3>

        <div class="space-y-4">
          <!-- Applicant Info -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-base-200 rounded-lg">
            <div>
              <label class="text-xs text-base-content/60">Applicant Name</label>
              <p class="font-medium">{{ selectedApplication.applicant_name }}</p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Status</label>
              <p><span class="badge" :class="applicationStatusClass(selectedApplication.status)">{{ selectedApplication.status }}</span></p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Email</label>
              <p class="text-sm">{{ selectedApplication.email }}</p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Phone</label>
              <p class="text-sm">{{ selectedApplication.phone || '—' }}</p>
            </div>
          </div>

          <!-- Vacancy Info -->
          <div class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Applied for</label>
            <p class="font-medium">{{ selectedApplication.RecruitmentVacancy?.title || 'N/A' }}</p>
            <p class="text-xs text-base-content/60 mt-1">
              {{ selectedApplication.RecruitmentVacancy?.Department?.name || '' }}
              · {{ selectedApplication.RecruitmentVacancy?.employment_type || '' }}
            </p>
          </div>

          <!-- Cover Letter -->
          <div v-if="selectedApplication.cover_letter" class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Cover Letter</label>
            <p class="text-sm mt-1 whitespace-pre-wrap">{{ selectedApplication.cover_letter }}</p>
          </div>

          <!-- Status Update (HR only) -->
          <div v-if="isHR && selectedApplication.status !== 'hired' && selectedApplication.status !== 'rejected'" class="border-t pt-4">
            <h4 class="font-semibold text-sm mb-3">Update Status</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">New Status</span></label>
                <select v-model="applicationStatusForm.status" class="select select-bordered select-sm">
                  <option value="">Select status</option>
                  <option v-for="s in nextStatuses(selectedApplication.status)" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div v-if="applicationStatusForm.status === 'interviewed'" class="form-control">
                <label class="label"><span class="label-text">Interview Score (1-100)</span></label>
                <input v-model.number="applicationStatusForm.interview_score" type="number" min="0" max="100" class="input input-bordered input-sm" />
              </div>
            </div>
            <div v-if="applicationStatusForm.status === 'rejected'" class="form-control mt-2">
              <label class="label"><span class="label-text">Rejection Reason</span></label>
              <textarea v-model="applicationStatusForm.rejection_reason" class="textarea textarea-bordered textarea-sm" rows="2"></textarea>
            </div>
            <button class="btn btn-primary btn-sm mt-3" @click="updateApplicationStatus" :disabled="!applicationStatusForm.status || hrStore.loading">
              <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
              Update Status
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showApplicationModal = false">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showApplicationModal = false"></div>
    </div>

    <!-- ==================== APPROVE APPOINTMENT MODAL ==================== -->
    <div v-if="showApproveModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Approve Appointment</h3>
        <p class="py-4">Are you sure you want to approve this appointment? This will create an employee record for the applicant.</p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showApproveModal = false">Cancel</button>
          <button class="btn btn-success btn-sm" @click="confirmApproveAppointment" :disabled="hrStore.loading">
            <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
            Confirm Approval
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showApproveModal = false"></div>
    </div>

    <!-- ==================== REJECT MODAL ==================== -->
    <div v-if="showRejectModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Reject Application</h3>
        <div class="form-control mt-4">
          <label class="label"><span class="label-text">Reason for rejection</span></label>
          <textarea v-model="rejectReason" class="textarea textarea-bordered" rows="3" placeholder="Optional reason..."></textarea>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showRejectModal = false">Cancel</button>
          <button class="btn btn-error btn-sm" @click="confirmRejectApplication" :disabled="hrStore.loading">
            <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
            Reject
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showRejectModal = false"></div>
    </div>
  </div>
</template>
