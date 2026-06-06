<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHrStore } from '../../../stores/hr'
import { useAuthStore } from '../../../stores/auth'

const hrStore = useHrStore()
const authStore = useAuthStore()

const isHR = computed(() => ['hr_officer', 'admin'].includes(authStore.user?.role?.name))
const isSupervisor = computed(() => ['supervisor', 'hr_officer', 'admin'].includes(authStore.user?.role?.name))

// --- Tab state ---
const activeTab = ref('all') // all | my-reviews | team-reviews

// --- New review modal ---
const showNewReviewModal = ref(false)
const reviewForm = ref({
  employee_id: '',
  review_period_start: '',
  review_period_end: '',
  goals_achieved: '',
  strengths: '',
  areas_improvement: '',
  overall_rating: 3,
  recommendations: ''
})

// --- View review modal ---
const showViewModal = ref(false)
const selectedReview = ref(null)

// --- Employees list for dropdown ---
const employees = ref([])

async function loadEmployees() {
  try {
    await hrStore.fetchEmployees({ limit: 200 })
    employees.value = hrStore.employees || []
  } catch (e) {
    console.error('Failed to load employees', e)
  }
}

// --- Fetch data ---
async function loadData() {
  if (activeTab.value === 'all' && isHR) {
    await hrStore.fetchPerformanceReviews()
  } else if (activeTab.value === 'my-reviews') {
    await hrStore.fetchMyPerformance()
  } else if (activeTab.value === 'team-reviews' && isSupervisor) {
    await hrStore.fetchTeamReviews()
  }
}

onMounted(async () => {
  if (isHR) {
    await Promise.all([hrStore.fetchPerformanceReviews(), loadEmployees()])
  } else if (isSupervisor) {
    await hrStore.fetchTeamReviews()
  }
  await hrStore.fetchMyPerformance()
})

// --- Create review ---
async function saveReview() {
  try {
    await hrStore.createPerformanceReview(reviewForm.value)
    showNewReviewModal.value = false
    resetForm()
    await loadData()
  } catch (e) {
    console.error('Failed to create review', e)
  }
}

function resetForm() {
  reviewForm.value = {
    employee_id: '',
    review_period_start: '',
    review_period_end: '',
    goals_achieved: '',
    strengths: '',
    areas_improvement: '',
    overall_rating: 3,
    recommendations: ''
  }
}

// --- Submit review (supervisor) ---
async function submitReview(id) {
  try {
    await hrStore.submitPerformanceReview(id)
    await loadData()
  } catch (e) {
    console.error('Failed to submit review', e)
  }
}

// --- View review ---
function viewReview(review) {
  selectedReview.value = review
  showViewModal.value = true
}

// --- Helpers ---
const statusClass = (status) => ({
  'badge-ghost': status === 'draft',
  'badge-info': status === 'submitted',
  'badge-warning': status === 'acknowledged',
  'badge-success': status === 'completed'
})

function ratingStars(rating) {
  return rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—'
}

// --- Determine which list to show ---
const reviewsList = computed(() => {
  if (activeTab.value === 'all') return hrStore.performanceReviews || []
  if (activeTab.value === 'my-reviews') return hrStore.myPerformanceReviews || []
  if (activeTab.value === 'team-reviews') return hrStore.teamReviews || []
  return []
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Performance Reviews</h1>
        <p class="text-sm text-base-content/70">Manage employee performance appraisals</p>
      </div>
      <div v-if="isHR" class="flex gap-2">
        <button class="btn btn-primary btn-sm" @click="showNewReviewModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Review
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-bordered">
      <a v-if="isHR" class="tab tab-bordered" :class="{ 'tab-active': activeTab === 'all' }" @click="activeTab = 'all'; loadData()">All Reviews</a>
      <a class="tab tab-bordered" :class="{ 'tab-active': activeTab === 'my-reviews' }" @click="activeTab = 'my-reviews'; loadData()">My Reviews</a>
      <a v-if="isSupervisor" class="tab tab-bordered" :class="{ 'tab-active': activeTab === 'team-reviews' }" @click="activeTab = 'team-reviews'; loadData()">Team Reviews</a>
    </div>

    <!-- Loading -->
    <div v-if="hrStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!reviewsList.length" class="text-center py-12 text-base-content/50">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <p class="text-lg font-medium">No performance reviews found</p>
      <p v-if="isHR" class="text-sm mt-1">Click "New Review" to create the first review</p>
    </div>

    <!-- Reviews Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Period</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Reviewer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in reviewsList" :key="review.id">
            <td>
              <div class="font-medium">{{ review.Employee?.first_name }} {{ review.Employee?.last_name }}</div>
              <div class="text-xs text-base-content/60">{{ review.Employee?.Position?.title || '' }}</div>
            </td>
            <td class="text-sm">
              {{ new Date(review.review_period_start).toLocaleDateString() }} — {{ new Date(review.review_period_end).toLocaleDateString() }}
            </td>
            <td>
              <span class="text-sm" :class="{ 'text-warning': review.overall_rating < 3, 'text-success': review.overall_rating >= 3 }">
                {{ ratingStars(review.overall_rating) }}
              </span>
            </td>
            <td>
              <span class="badge badge-sm" :class="statusClass(review.status)">{{ review.status }}</span>
            </td>
            <td class="text-sm">
              {{ review.Reviewer?.first_name }} {{ review.Reviewer?.last_name }}
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-xs" @click="viewReview(review)">View</button>
                <button v-if="review.status === 'draft' && isSupervisor" class="btn btn-primary btn-xs" @click="submitReview(review.id)" :disabled="hrStore.loading">
                  Submit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== NEW REVIEW MODAL ==================== -->
    <div v-if="showNewReviewModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">New Performance Review</h3>
        <form @submit.prevent="saveReview" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Employee *</span></label>
            <select v-model="reviewForm.employee_id" class="select select-bordered select-sm" required>
              <option value="">Select employee</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.first_name }} {{ emp.last_name }} — {{ emp.Position?.title || 'N/A' }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Period Start *</span></label>
              <input v-model="reviewForm.review_period_start" type="date" class="input input-bordered input-sm" required />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Period End *</span></label>
              <input v-model="reviewForm.review_period_end" type="date" class="input input-bordered input-sm" required />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Goals Achieved</span></label>
            <textarea v-model="reviewForm.goals_achieved" class="textarea textarea-bordered textarea-sm" rows="2" placeholder="Describe goals achieved during this period"></textarea>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Strengths</span></label>
            <textarea v-model="reviewForm.strengths" class="textarea textarea-bordered textarea-sm" rows="2" placeholder="Key strengths demonstrated"></textarea>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Areas for Improvement</span></label>
            <textarea v-model="reviewForm.areas_improvement" class="textarea textarea-bordered textarea-sm" rows="2" placeholder="Areas needing development"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Overall Rating (1-5)</span></label>
              <div class="flex items-center gap-2">
                <input v-model.number="reviewForm.overall_rating" type="range" min="1" max="5" step="1" class="range range-sm range-primary flex-1" />
                <span class="text-lg font-bold min-w-[3rem] text-center">{{ reviewForm.overall_rating }}</span>
              </div>
              <div class="flex justify-between px-1 text-xs text-base-content/50">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Preview</span></label>
              <p class="text-2xl text-warning">{{ ratingStars(reviewForm.overall_rating) }}</p>
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Recommendations</span></label>
            <textarea v-model="reviewForm.recommendations" class="textarea textarea-bordered textarea-sm" rows="2" placeholder="Recommendations for career development"></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="showNewReviewModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="hrStore.loading">
              <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
              Create Review
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="showNewReviewModal = false"></div>
    </div>

    <!-- ==================== VIEW REVIEW MODAL ==================== -->
    <div v-if="showViewModal && selectedReview" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Performance Review Details</h3>

        <div class="space-y-4">
          <!-- Header info -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-base-200 rounded-lg">
            <div>
              <label class="text-xs text-base-content/60">Employee</label>
              <p class="font-medium">{{ selectedReview.Employee?.first_name }} {{ selectedReview.Employee?.last_name }}</p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Status</label>
              <p><span class="badge" :class="statusClass(selectedReview.status)">{{ selectedReview.status }}</span></p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Review Period</label>
              <p class="text-sm">{{ new Date(selectedReview.review_period_start).toLocaleDateString() }} — {{ new Date(selectedReview.review_period_end).toLocaleDateString() }}</p>
            </div>
            <div>
              <label class="text-xs text-base-content/60">Reviewer</label>
              <p class="text-sm">{{ selectedReview.Reviewer?.first_name }} {{ selectedReview.Reviewer?.last_name }}</p>
            </div>
          </div>

          <!-- Rating -->
          <div class="p-4 bg-base-200 rounded-lg text-center">
            <label class="text-xs text-base-content/60 block mb-1">Overall Rating</label>
            <span class="text-3xl" :class="{ 'text-error': selectedReview.overall_rating < 3, 'text-warning': selectedReview.overall_rating === 3, 'text-success': selectedReview.overall_rating > 3 }">
              {{ ratingStars(selectedReview.overall_rating) }}
            </span>
            <span class="block text-sm mt-1 font-bold">{{ selectedReview.overall_rating }} / 5</span>
          </div>

          <!-- Details -->
          <div v-if="selectedReview.goals_achieved" class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Goals Achieved</label>
            <p class="text-sm mt-1 whitespace-pre-wrap">{{ selectedReview.goals_achieved }}</p>
          </div>

          <div v-if="selectedReview.strengths" class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Strengths</label>
            <p class="text-sm mt-1 whitespace-pre-wrap">{{ selectedReview.strengths }}</p>
          </div>

          <div v-if="selectedReview.areas_improvement" class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Areas for Improvement</label>
            <p class="text-sm mt-1 whitespace-pre-wrap">{{ selectedReview.areas_improvement }}</p>
          </div>

          <div v-if="selectedReview.recommendations" class="p-4 bg-base-200 rounded-lg">
            <label class="text-xs text-base-content/60">Recommendations</label>
            <p class="text-sm mt-1 whitespace-pre-wrap">{{ selectedReview.recommendations }}</p>
          </div>
        </div>

        <div class="modal-action">
          <button v-if="selectedReview.status === 'draft' && isSupervisor" class="btn btn-primary btn-sm" @click="submitReview(selectedReview.id); showViewModal = false" :disabled="hrStore.loading">
            <span v-if="hrStore.loading" class="loading loading-spinner loading-xs"></span>
            Submit Review
          </button>
          <button class="btn btn-ghost btn-sm" @click="showViewModal = false">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showViewModal = false"></div>
    </div>
  </div>
</template>
