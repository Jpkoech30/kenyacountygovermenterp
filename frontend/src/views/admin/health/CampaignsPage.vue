<script setup>
/**
 * CampaignsPage.vue
 * Campaign management page with list, create, and coverage tracking.
 * Uses vee-validate + Yup validation with base form components.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useHealthStore } from '../../../stores/health'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseTextarea from '../../../components/forms/BaseTextarea.vue'
import CampaignCoverageChart from '../../../components/health/CampaignCoverageChart.vue'

const healthStore = useHealthStore()

const loading = ref(false)
const showCreateModal = ref(false)
const showParticipantModal = ref(false)
const selectedCampaign = ref(null)
const activeTab = ref('list')

const formError = ref('')
const saving = ref(false)
const searchResults = ref([])
const searching = ref(false)
const showSearch = ref(false)

// Create campaign schema
const campaignSchema = yup.object({
  name: yup.string().required('Campaign name is required').min(3, 'Name must be at least 3 characters'),
  description: yup.string(),
  campaign_type: yup.string().required('Campaign type is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup.string().required('End date is required'),
  target_locations: yup.string(),
})

const {
  handleSubmit: handleCampaignSubmit,
  isSubmitting: isCampaignSubmitting,
  resetForm: resetCampaignForm,
  errors: campaignErrors,
} = useFormValidation(campaignSchema, {
  name: '',
  description: '',
  campaign_type: 'immunization',
  start_date: '',
  end_date: '',
  target_locations: '',
})

// Participant form (not using vee-validate since it's a simple search + select)
const participantPatientId = ref('')
const participantPatientSearch = ref('')
const participantNotes = ref('')
const participantSelectedDisplay = ref('')

onMounted(async () => {
  await loadCampaigns()
})

async function loadCampaigns() {
  loading.value = true
  try {
    const params = { page: healthStore.campaignsPagination.page }
    await healthStore.fetchCampaigns(params)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  resetCampaignForm({
    values: {
      name: '',
      description: '',
      campaign_type: 'immunization',
      start_date: '',
      end_date: '',
      target_locations: '',
    },
  })
  formError.value = ''
  showCreateModal.value = true
}

const onCreateCampaign = handleCampaignSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      name: formValues.name,
      description: formValues.description,
      campaign_type: formValues.campaign_type,
      start_date: formValues.start_date,
      end_date: formValues.end_date,
      target_locations: formValues.target_locations
        ? formValues.target_locations.split(',').map((s) => s.trim())
        : [],
    }
    await healthStore.createCampaign(payload)
    showCreateModal.value = false
    await loadCampaigns()
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to create campaign'
  } finally {
    saving.value = false
  }
})

async function viewCoverage(campaign) {
  selectedCampaign.value = campaign
  try {
    await healthStore.fetchCampaignCoverage(campaign.id)
  } catch (e) {
    console.error('Failed to load coverage:', e)
  }
}

function openParticipantModal(campaign) {
  selectedCampaign.value = campaign
  participantPatientId.value = ''
  participantPatientSearch.value = ''
  participantNotes.value = ''
  participantSelectedDisplay.value = ''
  searchResults.value = []
  showSearch.value = false
  formError.value = ''
  showParticipantModal.value = true
}

async function searchPatient() {
  if (!participantPatientSearch.value.trim()) return
  searching.value = true
  try {
    const data = await healthStore.fetchPatients({ search: participantPatientSearch.value, limit: 10 })
    searchResults.value = data.patients || []
    showSearch.value = true
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function selectPatient(patient) {
  participantPatientId.value = patient.id
  participantSelectedDisplay.value = `${patient.first_name} ${patient.last_name} (${patient.national_id})`
  showSearch.value = false
}

async function handleAddParticipant() {
  if (!participantPatientId.value || !selectedCampaign.value) return
  saving.value = true
  formError.value = ''
  try {
    await healthStore.addCampaignParticipant(selectedCampaign.value.id, {
      patient_id: participantPatientId.value,
      notes: participantNotes.value,
    })
    showParticipantModal.value = false
    // Refresh coverage
    await healthStore.fetchCampaignCoverage(selectedCampaign.value.id)
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to add participant'
  } finally {
    saving.value = false
  }
}

function changePage(page) {
  healthStore.campaignsPagination.page = page
  loadCampaigns()
}

const campaigns = healthStore.campaigns
const pagination = healthStore.campaignsPagination

const campaignTypeOptions = [
  { value: 'immunization', label: 'Immunization' },
  { value: 'medical_camp', label: 'Medical Camp' },
  { value: 'screening', label: 'Screening' },
  { value: 'awareness', label: 'Awareness' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Health Campaigns</h1>
      <button class="btn btn-primary" @click="openCreateModal">+ New Campaign</button>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed">
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'list' }" @click="activeTab = 'list'">Campaigns</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'coverage' }" @click="activeTab = 'coverage'">Coverage</a>
    </div>

    <!-- Campaign List -->
    <div v-if="activeTab === 'list'">
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="campaign in campaigns" :key="campaign.id" class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title">{{ campaign.name }}</h3>
            <div class="badge badge-outline">{{ campaign.campaign_type }}</div>
            <p class="text-sm text-base-content/70 mt-2">{{ campaign.description || 'No description' }}</p>
            <div class="text-xs text-base-content/50 mt-2">
              {{ new Date(campaign.start_date).toLocaleDateString() }} — {{ new Date(campaign.end_date).toLocaleDateString() }}
            </div>
            <div v-if="campaign.target_locations && campaign.target_locations.length > 0" class="mt-2">
              <div class="text-xs font-semibold">Target Locations:</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span v-for="loc in campaign.target_locations" :key="loc" class="badge badge-sm badge-ghost">{{ loc }}</span>
              </div>
            </div>
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-ghost btn-sm" @click="viewCoverage(campaign)">Coverage</button>
              <button class="btn btn-primary btn-sm" @click="openParticipantModal(campaign)">+ Participant</button>
            </div>
          </div>
        </div>
        <div v-if="campaigns.length === 0" class="col-span-full text-center text-base-content/60 py-8">
          No campaigns found.
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex justify-center mt-4">
        <div class="join">
          <button class="join-item btn btn-sm" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">«</button>
          <button class="join-item btn btn-sm" v-for="p in pagination.totalPages" :key="p" :class="{ 'btn-active': p === pagination.page }" @click="changePage(p)">{{ p }}</button>
          <button class="join-item btn btn-sm" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">»</button>
        </div>
      </div>
    </div>

    <!-- Coverage Tab -->
    <div v-if="activeTab === 'coverage'">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div class="form-control">
          <label class="label"><span class="label-text">Select Campaign</span></label>
          <select v-model="selectedCampaign" class="select select-bordered" @change="selectedCampaign && viewCoverage(selectedCampaign)">
            <option :value="null" disabled>Choose a campaign...</option>
            <option v-for="c in campaigns" :key="c.id" :value="c">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <CampaignCoverageChart
        :coverage="healthStore.campaignCoverage || { campaign: null, totalTarget: 0, totalReached: 0, participants: [] }"
        :loading="loading"
      />
    </div>

    <!-- Create Campaign Modal -->
    <dialog :open="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">New Campaign</h3>

        <div v-if="formError" class="alert alert-error mt-4">
          <span>{{ formError }}</span>
        </div>

        <form @submit.prevent="onCreateCampaign" class="space-y-4 mt-4">
          <BaseInput name="name" label="Campaign Name *" placeholder="Campaign name" />
          <BaseTextarea name="description" label="Description" :rows="3" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseSelect name="campaign_type" label="Campaign Type" :options="campaignTypeOptions" />
            <BaseInput name="target_locations" label="Target Locations" placeholder="Comma-separated villages" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="start_date" label="Start Date *" type="date" />
            <BaseInput name="end_date" label="End Date *" type="date" />
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="showCreateModal = false" :disabled="saving">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              Create Campaign
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>

    <!-- Add Participant Modal -->
    <dialog :open="showParticipantModal" class="modal" @click.self="showParticipantModal = false">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg">Add Participant</h3>
        <p v-if="selectedCampaign" class="text-sm text-base-content/70">Campaign: <strong>{{ selectedCampaign.name }}</strong></p>

        <div v-if="formError" class="alert alert-error mt-4">
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-4 mt-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Search Patient</span></label>
            <div class="join w-full">
              <input
                v-model="participantPatientSearch"
                type="text"
                placeholder="Name or national ID..."
                class="input input-bordered join-item flex-1"
                @keyup.enter="searchPatient"
              />
              <button type="button" class="btn btn-primary join-item btn-sm" @click="searchPatient" :disabled="searching">
                <span v-if="searching" class="loading loading-spinner loading-xs"></span>
                Search
              </button>
            </div>

            <!-- Results -->
            <div v-if="showSearch && searchResults.length > 0" class="mt-2 border rounded-lg shadow bg-base-100 max-h-40 overflow-y-auto">
              <div
                v-for="p in searchResults"
                :key="p.id"
                class="p-2 hover:bg-base-200 cursor-pointer border-b text-sm"
                @click="selectPatient(p)"
              >
                {{ p.first_name }} {{ p.last_name }} — {{ p.national_id }}
              </div>
            </div>
            <div v-else-if="showSearch && !searching" class="mt-2 text-sm text-base-content/60">No patients found</div>
          </div>

          <div v-if="participantSelectedDisplay" class="badge badge-info gap-2 p-3">
            Selected: {{ participantSelectedDisplay }}
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Notes</span></label>
            <textarea v-model="participantNotes" class="textarea textarea-bordered"></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="showParticipantModal = false" :disabled="saving">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handleAddParticipant" :disabled="saving || !participantPatientId">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            Add Participant
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showParticipantModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
