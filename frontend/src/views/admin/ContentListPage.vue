<script setup>
/**
 * ContentListPage.vue - Lists all CMS content with filtering, pagination, and workflow actions.
 * Supports type, status, and search filters. Each row shows workflow action buttons
 * based on the current status and user role.
 *
 * When navigated from the Website Content sidebar (e.g., /website/news),
 * the content type is auto-set from the route meta (contentType).
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContentStore } from '../../stores/content'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import AIContentAssistantModal from '../../components/AIContentAssistantModal.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import {
  Sparkles,
  Plus,
  EyeOff,
  Eye,
  X,
  Pencil,
  Send,
  Check,
  XCircle,
  Rocket,
  Calendar,
  CalendarOff,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()
const authStore = useAuthStore()
const { addToast } = useToast()

// Confirm dialog ref
const confirmDialog = ref(null)

// Prompt dialog state (for rejection reason & scheduling date)
const showPrompt = ref(false)
const promptTitle = ref('')
const promptMessage = ref('')
const promptInputLabel = ref('')
const promptInputPlaceholder = ref('')
const promptInputType = ref('text')
const promptInputValue = ref('')
const promptConfirmLabel = ref('Submit')
let promptResolve = null

function openPrompt(opts) {
  promptTitle.value = opts.title || 'Input'
  promptMessage.value = opts.message || ''
  promptInputLabel.value = opts.inputLabel || ''
  promptInputPlaceholder.value = opts.inputPlaceholder || ''
  promptInputType.value = opts.inputType || 'text'
  promptConfirmLabel.value = opts.confirmLabel || 'Submit'
  promptInputValue.value = ''
  showPrompt.value = true
  return new Promise((resolve) => {
    promptResolve = resolve
  })
}

function handlePromptConfirm() {
  showPrompt.value = false
  promptResolve?.(promptInputValue.value || null)
  promptResolve = null
}

function handlePromptCancel() {
  showPrompt.value = false
  promptResolve?.(null)
  promptResolve = null
}

// Determine the page context from route meta
const pageContentType = computed(() => route.meta?.contentType || '')

// Page heading derived from content type
const pageTitle = computed(() => {
  const labels = {
    news: 'News',
    event: 'Events',
    tender: 'Tenders',
    vacancy: 'Vacancies',
    department: 'Departments',
    person: 'Persons',
  }
  return pageContentType.value ? labels[pageContentType.value] || 'Content' : 'Content Manager'
})

const pageDescription = computed(() => {
  return pageContentType.value
    ? `Manage website ${pageTitle.value.toLowerCase()}`
    : 'Manage all CMS content'
})

// Create button label derived from content type
const createButtonLabel = computed(() => {
  if (!pageContentType.value) return '+ New Content'
  const singular = {
    news: 'News',
    event: 'Event',
    tender: 'Tender',
    vacancy: 'Vacancy',
    department: 'Department',
    person: 'Person',
  }
  return `+ New ${singular[pageContentType.value] || 'Content'}`
})

// Filters
const filters = ref({
  type: '',
  status: '',
  visibility: '',
  search: '',
  page: 1,
  limit: 20,
})

// Auto-set type filter from route meta on mount and on route change
watch(
  () => route.meta?.contentType,
  (contentType) => {
    filters.value.type = contentType || ''
    filters.value.page = 1
    loadContent()
  },
  { immediate: true }
)

const contentTypes = [
  { value: '', label: 'All Types' },
  { value: 'page', label: 'Page' },
  { value: 'news', label: 'News' },
  { value: 'event', label: 'Event' },
  { value: 'department_notice', label: 'Department Notice' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'tender', label: 'Tender' },
  { value: 'vacancy', label: 'Vacancy' },
  { value: 'department', label: 'Department' },
  { value: 'person', label: 'Person' },
]

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const visibilityOptions = [
  { value: '', label: 'All Visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'hidden', label: 'Manually Hidden' },
]

// Bulk selection
const selectedIds = ref([])

function toggleSelectAll() {
  if (selectedIds.value.length === contentStore.contentList.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = contentStore.contentList.map((c) => c.id)
  }
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

const bulkLoading = ref(false)

async function bulkHide() {
  if (!selectedIds.value.length) return
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Hide Content',
    message: `Hide ${selectedIds.value.length} content item(s) from the public website?`,
    variant: 'default',
    confirmLabel: 'Hide',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  bulkLoading.value = true
  try {
    await contentStore.bulkHideContent(selectedIds.value)
    addToast(`${selectedIds.value.length} content item(s) hidden.`, 'success')
    selectedIds.value = []
  } catch (err) {
    addToast('Failed to hide content.', 'error')
  } finally {
    bulkLoading.value = false
  }
}

async function bulkShow() {
  if (!selectedIds.value.length) return
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Show Content',
    message: `Show ${selectedIds.value.length} content item(s) on the public website?`,
    variant: 'default',
    confirmLabel: 'Show',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  bulkLoading.value = true
  try {
    await contentStore.bulkShowContent(selectedIds.value)
    addToast(`${selectedIds.value.length} content item(s) shown.`, 'success')
    selectedIds.value = []
  } catch (err) {
    addToast('Failed to show content.', 'error')
  } finally {
    bulkLoading.value = false
  }
}

// Computed permissions
const canApprove = computed(() =>
  ['reviewer', 'publisher', 'admin'].includes(authStore.userRole)
)
const canPublish = computed(() =>
  ['publisher', 'admin'].includes(authStore.userRole)
)
const isAdmin = computed(() => authStore.isAdmin)

// Search debounce — auto-search 400ms after user stops typing
let searchTimer = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.value.page = 1
    loadContent()
  }, 400)
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

// Load content
async function loadContent() {
  try {
    const params = { page: filters.value.page, limit: filters.value.limit }
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.visibility) params.visibility = filters.value.visibility
    if (filters.value.search) params.search = filters.value.search

    await contentStore.fetchContent(params)
  } catch (err) {
    addToast('Failed to load content.', 'error')
  }
}

function applyFilters() {
  filters.value.page = 1
  loadContent()
}

function goToPage(page) {
  filters.value.page = page
  loadContent()
}

function createNew() {
  const type = pageContentType.value
  if (type) {
    const routeNames = {
      news: 'WebsiteNewsCreate',
      event: 'WebsiteEventsCreate',
      tender: 'WebsiteTendersCreate',
      vacancy: 'WebsiteVacanciesCreate',
      department: 'WebsiteDepartmentsCreate',
      person: 'WebsitePersonsCreate',
    }
    const routeName = routeNames[type]
    if (routeName) {
      router.push({ name: routeName })
      return
    }
  }
  router.push({ name: 'ContentCreate' })
}

// AI Content Assistant
const showAiAssistant = ref(false)

function handleOpenEditor(path) {
  router.push(path)
}

function handleDraftSaved() {
  addToast('Draft saved successfully!', 'success')
  loadContent()
}

function editContent(id) {
  router.push(`/cms/content/${id}/edit`)
}

// Workflow actions
async function handleAction(action, content) {
  try {
    let result
    switch (action) {
      case 'submit':
        result = await contentStore.submitContent(content.id)
        addToast('Content submitted for review.', 'success')
        break
      case 'approve':
        result = await contentStore.approveContent(content.id)
        addToast('Content approved.', 'success')
        break
      case 'reject': {
        const reason = await openPrompt({
          title: 'Reject Content',
          message: 'Please provide a reason for rejection:',
          inputLabel: 'Rejection Reason',
          inputPlaceholder: 'Enter the reason for rejection...',
          inputType: 'text',
          confirmLabel: 'Reject',
        })
        if (!reason) return
        result = await contentStore.rejectContent(content.id, reason)
        addToast('Content rejected.', 'success')
        break
      }
      case 'publish':
        result = await contentStore.publishContent(content.id)
        addToast('Content published!', 'success')
        break
      case 'schedule': {
        const date = await openPrompt({
          title: 'Schedule Content',
          message: 'Select the date and time to publish:',
          inputLabel: 'Schedule Date & Time',
          inputPlaceholder: '',
          inputType: 'datetime-local',
          confirmLabel: 'Schedule',
        })
        if (!date) return
        result = await contentStore.scheduleContent(content.id, new Date(date).toISOString())
        addToast('Content scheduled.', 'success')
        break
      }
      case 'unschedule':
        result = await contentStore.unscheduleContent(content.id)
        addToast('Content unscheduled.', 'success')
        break
      case 'archive': {
        const confirmed = await confirmDialog.value.showDialog({
          title: 'Archive Content',
          message: 'Archive this content? It will be removed from the public website.',
          variant: 'default',
          confirmLabel: 'Archive',
          cancelLabel: 'Cancel',
        })
        if (!confirmed) return
        result = await contentStore.archiveContent(content.id)
        addToast('Content archived.', 'success')
        break
      }
      case 'delete': {
        const confirmed = await confirmDialog.value.showDialog({
          title: 'Delete Content',
          message: 'Delete this content? This action cannot be undone.',
          variant: 'danger',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        })
        if (!confirmed) return
        await contentStore.deleteContent(content.id)
        addToast('Content deleted.', 'success')
        break
      }
    }
  } catch (err) {
    addToast(err.response?.data?.message || `Failed to ${action} content.`, 'error')
  }
}

// Helpers
const statusBadgeClass = (status) => {
  const classes = {
    draft: 'badge-ghost',
    pending_review: 'badge-warning',
    approved: 'badge-info',
    scheduled: 'badge-secondary',
    published: 'badge-success',
    archived: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const visibilityBadgeClass = (content) => {
  if (content.manually_hidden) return 'badge-error'
  const classes = {
    public: 'badge-success',
    private: 'badge-ghost',
    scheduled: 'badge-info',
  }
  return classes[content.visibility] || 'badge-ghost'
}

const visibilityLabel = (content) => {
  if (content.manually_hidden) return 'Hidden'
  const labels = {
    public: 'Public',
    private: 'Private',
    scheduled: 'Scheduled',
  }
  return labels[content.visibility] || 'Unknown'
}

// Pagination helpers
const visiblePages = computed(() => {
  const total = contentStore.totalPages
  const current = filters.value.page
  const pages = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ pageTitle }}</h1>
        <p class="text-base-content/60">{{ pageDescription }}</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-secondary gap-2" @click="showAiAssistant = true">
          <Sparkles class="w-4 h-4" />
          AI Content Assistant
        </button>
        <button class="btn btn-primary gap-2" @click="createNew">
          <Plus class="w-4 h-4" />
          {{ createButtonLabel }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Type</span>
            </label>
            <select v-model="filters.type" class="select select-bordered select-sm" @change="applyFilters">
              <option v-for="t in contentTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Status</span>
            </label>
            <select v-model="filters.status" class="select select-bordered select-sm" @change="applyFilters">
              <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Visibility</span>
            </label>
            <select v-model="filters.visibility" class="select select-bordered select-sm" @change="applyFilters">
              <option v-for="v in visibilityOptions" :key="v.value" :value="v.value">{{ v.label }}</option>
            </select>
          </div>
          <div class="form-control flex-1 min-w-[200px]">
            <label class="label py-1">
              <span class="label-text">Search</span>
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search by title or content..."
              class="input input-bordered input-sm"
              @input="onSearchInput"
              @keyup.enter="applyFilters"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedIds.length > 0" class="flex items-center gap-2 p-3 bg-base-200 rounded-box">
      <span class="text-sm font-medium">{{ selectedIds.length }} selected</span>
      <button class="btn btn-sm btn-error gap-1" @click="bulkHide">
        <EyeOff class="w-4 h-4" />
        Hide from Public
      </button>
      <button class="btn btn-sm btn-success gap-1" @click="bulkShow">
        <Eye class="w-4 h-4" />
        Show on Public
      </button>
      <button class="btn btn-sm btn-ghost ml-auto gap-1" @click="selectedIds = []">
        <X class="w-4 h-4" />
        Clear selection
      </button>
    </div>

    <!-- Content Table -->
    <div class="card bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="w-10">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="selectedIds.length === contentStore.contentList.length && contentStore.contentList.length > 0"
                  @change="toggleSelectAll"
                />
              </th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Author</th>
              <th>Updated</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="contentStore.loading">
              <td colspan="8" class="text-center py-8">
                <span class="loading loading-spinner loading-md"></span>
              </td>
            </tr>
            <tr v-else-if="!contentStore.contentList.length">
              <td colspan="8" class="text-center py-8 text-base-content/50">
                No content found. Create your first piece of content!
              </td>
            </tr>
            <tr v-for="content in contentStore.contentList" :key="content.id">
              <td>
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="selectedIds.includes(content.id)"
                  @change="toggleSelect(content.id)"
                />
              </td>
              <td>
                <div class="font-medium">
                  {{ content.translations?.[0]?.title || 'Untitled' }}
                </div>
                <div class="text-xs text-base-content/50">/{{ content.slug }}</div>
              </td>
              <td>
                <span class="badge badge-outline badge-sm">{{ content.type }}</span>
              </td>
              <td>
                <span class="badge badge-sm" :class="statusBadgeClass(content.status)">
                  {{ content.status?.replace('_', ' ') }}
                </span>
              </td>
              <td>
                <span class="badge badge-sm" :class="visibilityBadgeClass(content)">
                  {{ visibilityLabel(content) }}
                </span>
              </td>
              <td class="text-sm">
                {{ content.author?.first_name }} {{ content.author?.last_name }}
              </td>
              <td class="text-sm">{{ formatDate(content.updatedAt) }}</td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <!-- Primary workflow action — visible button for the most common next action -->
                  <button
                    v-if="content.status === 'draft'"
                    class="btn btn-ghost btn-xs btn-square text-warning"
                    title="Submit for Review"
                    aria-label="Submit for Review"
                    @click="handleAction('submit', content)"
                  >
                    <Send class="w-4 h-4" />
                  </button>
                  <button
                    v-else-if="content.status === 'pending_review' && canApprove"
                    class="btn btn-ghost btn-xs btn-square text-success"
                    title="Approve"
                    aria-label="Approve"
                    @click="handleAction('approve', content)"
                  >
                    <Check class="w-4 h-4" />
                  </button>
                  <button
                    v-else-if="content.status === 'approved' && canPublish"
                    class="btn btn-ghost btn-xs btn-square text-primary"
                    title="Publish Now"
                    aria-label="Publish Now"
                    @click="handleAction('publish', content)"
                  >
                    <Rocket class="w-4 h-4" />
                  </button>

                  <!-- Visible Edit icon button — always visible -->
                  <button
                    class="btn btn-ghost btn-xs btn-square"
                    title="Edit"
                    aria-label="Edit content"
                    @click="editContent(content.id)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>

                  <!-- Dropdown for all other workflow actions -->
                  <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-ghost btn-xs btn-square" aria-label="More actions">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </label>
                    <ul tabindex="0" class="dropdown-content menu menu-compact p-2 shadow bg-base-100 rounded-box w-48 z-10">

                    <!-- Draft actions -->
                    <li v-if="content.status === 'draft'">
                      <a @click="handleAction('submit', content)" class="gap-2">
                        <Send class="w-4 h-4" />
                        Submit for Review
                      </a>
                    </li>

                    <!-- Pending review actions -->
                    <li v-if="content.status === 'pending_review' && canApprove">
                      <a @click="handleAction('approve', content)" class="gap-2">
                        <Check class="w-4 h-4" />
                        Approve
                      </a>
                    </li>
                    <li v-if="content.status === 'pending_review' && canApprove">
                      <a @click="handleAction('reject', content)" class="gap-2">
                        <XCircle class="w-4 h-4" />
                        Reject
                      </a>
                    </li>

                    <!-- Approved actions -->
                    <li v-if="content.status === 'approved' && canPublish">
                      <a @click="handleAction('publish', content)" class="gap-2">
                        <Rocket class="w-4 h-4" />
                        Publish Now
                      </a>
                    </li>
                    <li v-if="content.status === 'approved' && canPublish">
                      <a @click="handleAction('schedule', content)" class="gap-2">
                        <Calendar class="w-4 h-4" />
                        Schedule
                      </a>
                    </li>

                    <!-- Scheduled actions -->
                    <li v-if="content.status === 'scheduled' && canPublish">
                      <a @click="handleAction('unschedule', content)" class="gap-2">
                        <CalendarOff class="w-4 h-4" />
                        Unschedule
                      </a>
                    </li>

                    <!-- Archive (published/scheduled) -->
                    <li v-if="['published', 'scheduled'].includes(content.status) && canPublish">
                      <a @click="handleAction('archive', content)" class="gap-2">
                        <Archive class="w-4 h-4" />
                        Archive
                      </a>
                    </li>

                    <!-- Delete (admin only) -->
                    <li v-if="isAdmin">
                      <a @click="handleAction('delete', content)" class="text-error gap-2">
                        <Trash2 class="w-4 h-4" />
                        Delete
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="contentStore.totalPages > 1"
        class="flex justify-center p-4"
      >
        <div class="join">
          <button
            class="join-item btn btn-sm"
            :disabled="filters.page <= 1"
            @click="goToPage(filters.page - 1)"
            aria-label="Previous page"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            v-for="p in visiblePages"
            :key="p"
            class="join-item btn btn-sm"
            :class="{ 'btn-active': p === filters.page }"
            @click="goToPage(p)"
            :aria-label="`Page ${p}`"
            :aria-current="p === filters.page ? 'page' : undefined"
          >
            {{ p }}
          </button>
          <button
            class="join-item btn btn-sm"
            :disabled="filters.page >= contentStore.totalPages"
            @click="goToPage(filters.page + 1)"
            aria-label="Next page"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- AI Content Assistant Modal -->
    <AIContentAssistantModal
      :visible="showAiAssistant"
      @close="showAiAssistant = false"
      @open-editor="handleOpenEditor"
      @draft-saved="handleDraftSaved"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />

    <!-- Prompt Modal (for rejection reason & scheduling) -->
    <Teleport to="body">
      <dialog
        :open="showPrompt"
        class="modal modal-bottom sm:modal-middle"
        @click.self="handlePromptCancel"
        @keydown.escape="handlePromptCancel"
      >
        <div class="modal-box">
          <h3 class="font-bold text-lg text-center mb-2">{{ promptTitle }}</h3>
          <p class="text-sm text-base-content/70 text-center mb-4">{{ promptMessage }}</p>

          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ promptInputLabel }}</span>
            </label>
            <textarea
              v-if="promptInputType === 'text'"
              v-model="promptInputValue"
              class="textarea textarea-bordered"
              :placeholder="promptInputPlaceholder"
              rows="3"
            ></textarea>
            <input
              v-else
              v-model="promptInputValue"
              type="datetime-local"
              class="input input-bordered"
            />
          </div>

          <div class="flex justify-center gap-3 mt-6">
            <button class="btn btn-ghost" @click="handlePromptCancel">Cancel</button>
            <button class="btn btn-primary" @click="handlePromptConfirm">
              {{ promptConfirmLabel }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="handlePromptCancel">close</button>
        </form>
      </dialog>
    </Teleport>
  </div>
</template>
