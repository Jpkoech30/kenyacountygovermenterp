<script setup>
/**
 * ContentEditorPage.vue - Full-page content editor wrapping the ContentEditor component.
 * Handles content creation and editing, including slug generation, taxonomy selection,
 * media attachment, workflow actions, type-specific meta fields, and AI Assist features.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Props — route passes :id via props: true
const props = defineProps({
  id: {
    type: [String, Number],
    default: null,
  },
})

/** Whether we are editing an existing content item (has an :id param) */
const contentId = computed(() => props.id || route.params.id || null)
const isEditing = computed(() => !!contentId.value)
import { useContentStore } from '../../stores/content'
import { useTaxonomyStore } from '../../stores/taxonomy'
import { useAuthStore } from '../../stores/auth'
import apiClient from '../../api/axios'
import ContentEditor from '../../components/ContentEditor.vue'
import MediaLibraryModal from '../../components/MediaLibraryModal.vue'
import PreviewModal from '../../components/PreviewModal.vue'
import AIActionModal from '../../components/AIActionModal.vue'
import GrammarCheck from '../../components/GrammarCheck.vue'
import TagSuggestion from '../../components/TagSuggestion.vue'
import BaseFormCard from '../../components/forms/BaseFormCard.vue'
import {
  checkGrammar,
  translateText,
  suggestTags,
  suggestSeo,
  improveWriting,
} from '../../api/ai'
import {
  Sparkles,
  Eye,
  Send,
  CheckCircle,
  Rocket,
  ArrowLeft,
  ChevronRight,
  X,
  Plus,
  FileText,
  Languages,
  Tags,
  Search,
  PenTool,
  EyeOff,
  Globe,
  Calendar,
  FolderOpen,
  Bookmark,
  Paperclip,
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useFormDirty } from '../../composables/useFormDirty'

// --- Composables ---
const { addToast } = useToast()
const { isDirty, markClean, markDirty, setOriginalSnapshot, updateSnapshot, registerBeforeLeave } = useFormDirty()
registerBeforeLeave()

const route = useRoute()
const router = useRouter()
const contentStore = useContentStore()
const taxonomyStore = useTaxonomyStore()
const authStore = useAuthStore()

// --- Constants ---
const CONTENT_TYPES = [
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

const PERSON_TITLES = [
  { value: 'Governor', label: 'Governor' },
  { value: 'Deputy Governor', label: 'Deputy Governor' },
  { value: 'CEC', label: 'County Executive Committee Member (CEC)' },
  { value: 'Chief Officer', label: 'Chief Officer' },
  { value: 'Director', label: 'Director' },
  { value: 'Manager', label: 'Manager' },
]

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'website', label: 'Website' },
]

const AI_ACTIONS = [
  { key: 'grammar', label: 'Check Grammar', icon: 'PenTool', estCost: '~KES 0.02' },
  { key: 'translate', label: 'Translate', icon: 'Languages', estCost: '~KES 0.04' },
  { key: 'tags', label: 'Suggest Tags', icon: 'Tags', estCost: '~KES 0.01' },
  { key: 'seo', label: 'Suggest SEO', icon: 'Search', estCost: '~KES 0.02' },
  { key: 'improve', label: 'Improve Writing', icon: 'Sparkles', estCost: '~KES 0.04' },
]

const LOCALE_LABELS = { en: 'English', sw: 'Kiswahili', pok: 'Pokot' }
const TARGET_LOCALE_MAP = { en: 'sw', sw: 'pok', pok: 'en' }

/** Default empty form factory — avoids mutation bugs from reusing the same object */
function createEmptyForm(contentType = 'page') {
  return {
    type: contentType,
    slug: '',
    visibility: 'public',
    visible_from: '',
    visible_to: '',
    manually_hidden: false,
    translations: {
      en: { title: '', body: '', excerpt: '', meta_description: '', meta_keywords: '' },
      sw: { title: '', body: '', excerpt: '', meta_description: '', meta_keywords: '' },
      pok: { title: '', body: '', excerpt: '', meta_description: '', meta_keywords: '' },
    },
    taxonomy_ids: [],
    media_ids: [],
    meta: {
      category_id: null,
      published_at: '',
      start_date: '',
      end_date: '',
      location: '',
      event_url: '',
      closing_date: '',
      reference_number: '',
      document_id: null,
      job_title: '',
      department_id: null,
      contact_phone: '',
      contact_email: '',
      service_charter_id: null,
      sort_order: 0,
      person_title: '',
      photo_id: null,
      social_links: [],
    },
  }
}

// --- Reactive State ---
const form = ref(createEmptyForm())

const saving = ref(false)
const loading = ref(true)
const error = ref(null)

// Departments list for dropdowns
const departments = ref([])
const departmentsLoading = ref(false)

// ContentEditor ref for calling methods
const contentEditorRef = ref(null)

// Modals
const showMediaModal = ref(false)
const showMediaPickerFor = ref(null) // 'document', 'photo', 'service_charter', or null
const showPreview = ref(false)
const previewLocale = ref('en')

// AI Assist state
const aiLoading = ref(false)
const aiError = ref(null)
const aiResult = ref(null)
const aiCostKes = ref(null)
const aiModalTitle = ref('')
const aiModalVisible = ref(false)
const aiActiveLocale = ref('en')
const aiShowAccept = ref(false)
const aiAcceptLabel = ref('Apply')

// --- Collapsible Sidebar Sections ---
const sidebarSections = ref({
  visibility: true,
  typeSpecific: true,
  categories: true,
  tags: true,
  media: true,
})

function toggleSection(key) {
  sidebarSections.value[key] = !sidebarSections.value[key]
}

// --- Form Validation ---
const validationErrors = ref({})

function validateForm() {
  const errors = {}
  const en = form.value.translations.en

  // Title is required
  if (!en.title || !en.title.trim()) {
    errors.title = 'English title is required'
  }

  // Slug is required and must be valid format
  if (!form.value.slug || !form.value.slug.trim()) {
    errors.slug = 'Slug is required'
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.value.slug)) {
    errors.slug = 'Slug must be lowercase with hyphens only (e.g. my-content-slug)'
  }

  // Type-specific validation
  if (form.value.type === 'event') {
    if (form.value.meta.start_date && form.value.meta.end_date) {
      if (new Date(form.value.meta.start_date) >= new Date(form.value.meta.end_date)) {
        errors.end_date = 'End date must be after start date'
      }
    }
  }

  if (form.value.type === 'tender' || form.value.type === 'vacancy') {
    if (!form.value.meta.closing_date) {
      errors.closing_date = 'Closing date is required'
    }
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

// Get active translation text for AI processing
function getActiveText() {
  const t = form.value.translations[aiActiveLocale.value]
  if (!t) return ''
  return t.body || t.title || ''
}

function setActiveText(body, title) {
  const t = form.value.translations[aiActiveLocale.value]
  if (!t) return
  if (body !== undefined) t.body = body
  if (title !== undefined) t.title = title
}

// --- AI Action Handlers ---

async function handleAiAction(action) {
  closeAiDropdown()
  aiLoading.value = true
  aiError.value = null
  aiResult.value = null
  aiCostKes.value = null
  aiShowAccept.value = false
  aiAcceptLabel.value = 'Apply'

  try {
    const locale = aiActiveLocale.value
    const t = form.value.translations[locale]
    const title = t?.title || ''
    const body = t?.body || ''

    switch (action) {
      case 'grammar': {
        aiModalTitle.value = 'Grammar Check'
        const res = await checkGrammar(body || title, locale)
        aiResult.value = { type: 'grammar', data: res }
        aiShowAccept.value = true
        aiAcceptLabel.value = 'Replace with corrected text'
        break
      }
      case 'translate': {
        aiModalTitle.value = 'Translate'
        // Cycle through locales: en -> sw -> pok -> en
        const targetMap = { en: 'sw', sw: 'pok', pok: 'en' }
        const targetLocale = targetMap[locale] || 'en'
        const res = await translateText(body || title, locale, targetLocale)
        aiResult.value = {
          type: 'translate',
          data: res,
          targetLocale,
          targetLabel: { en: 'English', sw: 'Kiswahili', pok: 'Pokot' }[targetLocale],
        }
        aiShowAccept.value = true
        aiAcceptLabel.value = `Save as ${aiResult.value.targetLabel} translation`
        break
      }
      case 'tags': {
        aiModalTitle.value = 'Suggested Tags'
        const res = await suggestTags(title, body, 10)
        aiResult.value = { type: 'tags', data: res }
        aiShowAccept.value = true
        aiAcceptLabel.value = 'Apply selected tags'
        break
      }
      case 'seo': {
        aiModalTitle.value = 'SEO Suggestions'
        const res = await suggestSeo(title, body, locale)
        aiResult.value = { type: 'seo', data: res }
        aiShowAccept.value = true
        aiAcceptLabel.value = 'Apply SEO metadata'
        break
      }
      case 'improve': {
        aiModalTitle.value = 'Improve Writing'
        const res = await improveWriting(body || title, 'Improve clarity, grammar, and professionalism')
        aiResult.value = { type: 'improve', data: res }
        aiShowAccept.value = true
        aiAcceptLabel.value = 'Replace with improved text'
        break
      }
    }

    if (aiResult.value?.data?.costKes) {
      aiCostKes.value = aiResult.value.data.costKes
    }

    aiModalVisible.value = true
  } catch (err) {
    aiError.value = err.response?.data?.message || err.message || 'AI request failed'
    aiModalVisible.value = true
  } finally {
    aiLoading.value = false
  }
}

// Handle AI result acceptance
function handleAiAccept() {
  if (!aiResult.value) return

  const { type, data } = aiResult.value

  switch (type) {
    case 'grammar': {
      if (data.corrected) {
        const locale = aiActiveLocale.value
        const t = form.value.translations[locale]
        if (t) t.body = data.corrected
        addToast('Grammar corrections applied.')
      }
      break
    }
    case 'translate': {
      const { targetLocale } = aiResult.value
      if (data.translatedText && form.value.translations[targetLocale]) {
        form.value.translations[targetLocale].body = data.translatedText
        addToast(`Translation saved to ${aiResult.value.targetLabel}.`)
      }
      break
    }
    case 'tags': {
      if (data.tags && data.tags.length) {
        // Find matching taxonomy tags by name
        const matchedIds = taxonomyStore.tags
          .filter((tag) => data.tags.includes(tag.name.toLowerCase()))
          .map((tag) => tag.id)
        // Add matched tags to form
        for (const id of matchedIds) {
          if (!form.value.taxonomy_ids.includes(id)) {
            form.value.taxonomy_ids.push(id)
          }
        }
        addToast(`${matchedIds.length} tag(s) applied.`)
      }
      break
    }
    case 'seo': {
      const locale = aiActiveLocale.value
      const t = form.value.translations[locale]
      if (t) {
        if (data.metaDescription) t.meta_description = data.metaDescription
        if (data.metaKeywords) t.meta_keywords = data.metaKeywords
      }
      addToast('SEO metadata applied.')
      break
    }
    case 'improve': {
      if (data.rewrittenText) {
        const locale = aiActiveLocale.value
        const t = form.value.translations[locale]
        if (t) t.body = data.rewrittenText
        addToast('Improved text applied.')
      }
      break
    }
  }

  aiModalVisible.value = false
}

// Load departments for dropdowns
async function loadDepartments() {
  departmentsLoading.value = true
  try {
    const response = await apiClient.get('/departments')
    departments.value = response.data.departments || []
  } catch (err) {
    console.warn('Failed to load departments:', err.message)
    departments.value = []
  } finally {
    departmentsLoading.value = false
  }
}

// Helper to convert meta array to object
function metaArrayToObject(metaArray) {
  const obj = {}
  for (const m of metaArray) {
    // Try to parse JSON values for arrays/objects
    try {
      obj[m.meta_key] = JSON.parse(m.meta_value)
    } catch {
      obj[m.meta_key] = m.meta_value
    }
  }
  return obj
}

// Helper to convert meta object to array for API
function metaObjectToArray(metaObj) {
  const arr = []
  for (const [key, value] of Object.entries(metaObj)) {
    if (value !== null && value !== '' && value !== undefined) {
      // Serialize arrays/objects to JSON strings
      const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
      arr.push({ meta_key: key, meta_value: val })
    }
  }
  return arr
}

// Load data
onMounted(async () => {
  try {
    // Load taxonomies for selector
    await taxonomyStore.fetchTaxonomies()

    // Load departments for dropdowns
    await loadDepartments()

    // If a contentType is specified via route meta (e.g. /website/news/create),
    // pre-set the form type for new content creation
    if (!isEditing.value && route.meta?.contentType) {
      form.value.type = route.meta.contentType
    }

    // Handle pre-filled data from AI Content Assistant (query params)
    if (!isEditing.value && route.query?.title) {
      form.value.type = route.query.type || 'page'
      form.value.slug = route.query.slug || ''
      form.value.translations.en.title = route.query.title || ''
      form.value.translations.en.body = route.query.body || ''
      form.value.translations.en.excerpt = route.query.excerpt || ''

      // Parse categories from query param
      if (route.query.categories) {
        const categoryNames = route.query.categories.split(',')
        // Match category names to taxonomy IDs
        const matchedIds = taxonomyStore.categories
          .filter((cat) => categoryNames.includes(cat.name))
          .map((cat) => cat.id)
        form.value.taxonomy_ids = matchedIds
      }

      // Set source_url in meta if provided
      if (route.query.source_url) {
        form.value.meta.source_url = route.query.source_url
      }

      addToast('Draft pre-filled from AI Content Assistant.', 'info')
    }

    // If editing, load content
    if (isEditing.value) {
      const content = await contentStore.fetchContentById(contentId.value)
      if (content) {
        form.value.type = content.type
        form.value.slug = content.slug
        form.value.visibility = content.visibility || 'public'
        form.value.visible_from = content.visible_from ? content.visible_from.slice(0, 16) : ''
        form.value.visible_to = content.visible_to ? content.visible_to.slice(0, 16) : ''
        form.value.manually_hidden = content.manually_hidden || false
        form.value.taxonomy_ids = content.taxonomies?.map((t) => t.id) || []
        form.value.media_ids = content.media?.map((m) => m.id) || []

        // Map translations
        if (content.translations) {
          for (const t of content.translations) {
            if (form.value.translations[t.locale]) {
              form.value.translations[t.locale] = {
                title: t.title || '',
                body: t.body || '',
                excerpt: t.excerpt || '',
                meta_description: t.meta_description || '',
                meta_keywords: t.meta_keywords || '',
              }
            }
          }
        }

        // Map meta fields
        if (content.meta && content.meta.length) {
          const metaObj = metaArrayToObject(content.meta)
          // Merge into form.meta, preserving defaults for missing keys
          form.value.meta = { ...form.value.meta, ...metaObj }
          // Ensure social_links is always an array
          if (!Array.isArray(form.value.meta.social_links)) {
            form.value.meta.social_links = []
          }
        }
      }
    }
    // Set initial snapshot for dirty tracking
    setOriginalSnapshot(form.value)
  } catch (err) {
    error.value = 'Failed to load data.'
    addToast('Failed to load content.', 'error')
  } finally {
    loading.value = false
  }
})

// --- Debounced Dirty Tracking ---
// Use a debounced deep watch to avoid excessive updateSnapshot calls on rapid typing
let dirtyTimer = null
watch(
  () => form.value,
  (newVal) => {
    if (!loading.value) {
      if (dirtyTimer) clearTimeout(dirtyTimer)
      dirtyTimer = setTimeout(() => {
        updateSnapshot(newVal)
      }, 300)
    }
  },
  { deep: true }
)

// Watch for route changes (e.g. navigating between /website/news/create and /website/events/create)
// to reset the form when the content type changes via route meta.
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath === oldPath) return
    // Only reset if both routes use ContentEditorPage (no :id param means create mode)
    if (!route.params.id && !isEditing.value) {
      form.value = createEmptyForm(route.meta?.contentType || 'page')
      loading.value = false
    }
  }
)

// Auto-generate slug from title (debounced)
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

let slugTimer = null
watch(
  () => form.value.translations.en.title,
  (title) => {
    if (!isEditing.value && title && !form.value.slug) {
      if (slugTimer) clearTimeout(slugTimer)
      slugTimer = setTimeout(() => {
        form.value.slug = generateSlug(title)
      }, 400)
    }
  }
)

// Social links helpers
function addSocialLink() {
  form.value.meta.social_links.push({ platform: 'facebook', url: '' })
}

function removeSocialLink(index) {
  form.value.meta.social_links.splice(index, 1)
}

// Save handler
async function handleSave(translationsData) {
  // Run validation before saving
  if (!validateForm()) {
    addToast('Please fix validation errors before saving.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      type: form.value.type,
      slug: form.value.slug,
      visibility: form.value.visibility,
      visible_from: form.value.visible_from || null,
      visible_to: form.value.visible_to || null,
      manually_hidden: form.value.manually_hidden,
      translations: Object.entries(translationsData || form.value.translations).map(
        ([locale, data]) => ({
          locale,
          title: data.title,
          body: data.body,
          excerpt: data.excerpt,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
        })
      ),
      taxonomy_ids: form.value.taxonomy_ids,
      media_ids: form.value.media_ids,
      meta: metaObjectToArray(form.value.meta),
    }

    if (isEditing.value) {
      await contentStore.updateContent(contentId.value, payload)
      addToast('Content updated successfully.')
      markClean()
      validationErrors.value = {}
    } else {
      const created = await contentStore.createContent(payload)
      addToast('Content created successfully.')
      // Redirect to edit mode
      router.replace(`/cms/content/${created.id}/edit`)
      // After redirect, the onMounted will set the snapshot
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save content.', 'error')
  } finally {
    saving.value = false
  }
}

// Workflow actions
async function handleWorkflow(action) {
  if (!isEditing.value) {
    addToast('Please save the content first.', 'warning')
    return
  }

  try {
    const actions = {
      submit: () => contentStore.submitContent(contentId.value),
      approve: () => contentStore.approveContent(contentId.value),
      publish: () => contentStore.publishContent(contentId.value),
    }
    await actions[action]()
    addToast(`Content ${action}ed successfully.`)
  } catch (err) {
    addToast(err.response?.data?.message || `Failed to ${action} content.`, 'error')
  }
}

// Media selection
function handleMediaSelect(media) {
  // If we're picking for a specific meta field
  if (showMediaPickerFor.value) {
    const field = showMediaPickerFor.value // 'document', 'photo', 'service_charter'
    if (field === 'document') {
      form.value.meta.document_id = media.id
    } else if (field === 'photo') {
      form.value.meta.photo_id = media.id
    } else if (field === 'service_charter') {
      form.value.meta.service_charter_id = media.id
    }
    showMediaPickerFor.value = null
    return
  }

  // If the media modal was opened from the editor toolbar, insert image into editor
  if (media.mime_type?.startsWith('image/') && contentEditorRef.value) {
    contentEditorRef.value.insertImageFromMedia(media)
    showMediaModal.value = false
    return
  }

  // Default: add to general media attachments
  if (!form.value.media_ids.includes(media.id)) {
    form.value.media_ids.push(media.id)
  }
}

function removeMedia(mediaId) {
  form.value.media_ids = form.value.media_ids.filter((id) => id !== mediaId)
}

// Close media picker without selecting
function closeMediaPicker() {
  showMediaPickerFor.value = null
}

// Preview
function openPreview() {
  previewLocale.value = 'en'
  showPreview.value = true
}

// Computed
const canSubmit = computed(() => contentStore.currentContent?.status === 'draft')
const canApprove = computed(
  () =>
    contentStore.currentContent?.status === 'pending_review' &&
    ['reviewer', 'publisher', 'admin'].includes(authStore.userRole)
)
const canPublish = computed(
  () =>
    contentStore.currentContent?.status === 'approved' &&
    ['publisher', 'admin'].includes(authStore.userRole)
)

/** Dynamic title for the type-specific fields sidebar card */
const typeSpecificTitle = computed(() => {
  const type = form.value.type
  if (type === 'person') return 'Person Details'
  if (type === 'department') return 'Department Details'
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Details'
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button class="btn btn-ghost btn-xs btn-square" @click="router.push('/cms/content')" title="Back to list">
            <ArrowLeft class="w-4 h-4" />
          </button>
          <h1 class="text-xl sm:text-2xl font-bold">
            {{ isEditing ? 'Edit Content' : 'Create New Content' }}
          </h1>
        </div>
        <p class="text-sm text-base-content/60 ml-8">
          {{ isEditing ? `Editing #${contentId}` : 'Create a new piece of content' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-outline btn-sm" @click="openPreview" :disabled="!isEditing">
          <Eye class="w-4 h-4" />
          Preview
        </button>
        <button
          v-if="canSubmit"
          class="btn btn-warning btn-sm"
          @click="handleWorkflow('submit')"
        >
          <Send class="w-4 h-4" />
          Submit
        </button>
        <button
          v-if="canApprove"
          class="btn btn-info btn-sm"
          @click="handleWorkflow('approve')"
        >
          <CheckCircle class="w-4 h-4" />
          Approve
        </button>
        <button
          v-if="canPublish"
          class="btn btn-success btn-sm"
          @click="handleWorkflow('publish')"
        >
          <Rocket class="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <!-- Form -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <!-- Main Editor (3/5 width on xl, full on smaller) -->
      <div class="xl:col-span-3 space-y-4">
        <!-- Content Type + Slug -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label" for="content-type-select">
                  <span class="label-text font-medium">Content Type</span>
                </label>
                <select
                  id="content-type-select"
                  v-model="form.type"
                  class="select select-bordered w-full"
                  aria-describedby="content-type-help"
                >
                  <option v-for="t in CONTENT_TYPES" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
                <span id="content-type-help" class="text-xs text-base-content/50 mt-1">
                  Determines which metadata fields are shown
                </span>
              </div>
              <div class="form-control">
                <label class="label" for="slug-input">
                  <span class="label-text font-medium">Slug</span>
                </label>
                <input
                  id="slug-input"
                  v-model="form.slug"
                  type="text"
                  class="input input-bordered w-full"
                  :class="{ 'input-error': validationErrors.slug }"
                  placeholder="my-content-slug"
                  aria-describedby="slug-error slug-help"
                />
                <span id="slug-help" class="text-xs text-base-content/50 mt-1">
                  URL-friendly identifier (auto-generated from title)
                </span>
                <span
                  v-if="validationErrors.slug"
                  id="slug-error"
                  class="text-xs text-error mt-1"
                  role="alert"
                >
                  {{ validationErrors.slug }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TipTap Editor -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <!-- AI Assist Toolbar — compact single row -->
            <div class="flex flex-wrap items-center gap-1.5 mb-3 pb-3 border-b border-base-200">
              <Sparkles class="w-3.5 h-3.5 text-secondary shrink-0" />
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider shrink-0">AI</span>

              <!-- Locale selector -->
              <select
                v-model="aiActiveLocale"
                class="select select-ghost select-xs"
                aria-label="AI target locale"
              >
                <option value="en">EN</option>
                <option value="sw">SW</option>
                <option value="pok">POK</option>
              </select>

              <!-- AI Actions — inline buttons instead of dropdown -->
              <button
                v-for="action in AI_ACTIONS"
                :key="action.key"
                class="btn btn-ghost btn-xs gap-1"
                :disabled="aiLoading"
                @click="handleAiAction(action.key)"
                :title="`${action.label} (${action.estCost})`"
              >
                <PenTool v-if="action.icon === 'PenTool'" class="w-3 h-3" />
                <Languages v-else-if="action.icon === 'Languages'" class="w-3 h-3" />
                <Tags v-else-if="action.icon === 'Tags'" class="w-3 h-3" />
                <Search v-else-if="action.icon === 'Search'" class="w-3 h-3" />
                <Sparkles v-else class="w-3 h-3" />
                <span class="hidden sm:inline">{{ action.label }}</span>
              </button>

              <!-- Loading indicator -->
              <span
                v-if="aiLoading"
                class="loading loading-spinner loading-xs text-secondary"
              ></span>
            </div>

            <ContentEditor
              ref="contentEditorRef"
              v-model="form.translations"
              @save="handleSave"
              @open-media-modal="showMediaModal = true"
            />
          </div>
        </div>
      </div>

      <!-- Right Panel (2/5 width on xl) — sidebar + extra fields combined -->
      <div class="xl:col-span-2 space-y-4">
        <!-- Save Button (sticky on xl screens) — prominent primary action -->
        <div class="xl:sticky xl:top-4 z-10">
          <BaseFormCard>
            <button
              class="btn btn-primary w-full gap-2"
              :disabled="saving || (!isDirty && isEditing)"
              @click="handleSave()"
              aria-label="Save content"
            >
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              <FileText v-else class="w-4 h-4" />
              <span class="font-semibold">{{ saving ? 'Saving...' : isEditing ? 'Update Content' : 'Create Content' }}</span>
              <span
                v-if="isDirty && !saving"
                class="badge badge-xs badge-warning ml-1"
              >Unsaved</span>
            </button>
          </BaseFormCard>
        </div>

        <!-- Visibility Settings (collapsible) -->
        <BaseFormCard>
          <template #title>
            <button
              class="flex items-center justify-between w-full gap-2 cursor-pointer"
              @click="toggleSection('visibility')"
              :aria-expanded="sidebarSections.visibility"
              aria-controls="section-visibility"
            >
              <div class="flex items-center gap-2">
                <EyeOff class="w-4 h-4 text-base-content/60" />
                <span class="font-medium">Visibility</span>
              </div>
              <ChevronRight
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.visibility }"
              />
            </button>
          </template>
          <div v-show="sidebarSections.visibility" id="section-visibility">
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="radio"
                name="visibility"
                class="radio radio-sm radio-primary"
                value="public"
                v-model="form.visibility"
              />
              <span class="label-text">Public</span>
            </label>
            <p class="text-xs text-base-content/50 ml-7 -mt-1">
              Visible to everyone on the public website.
            </p>
          </div>

          <div class="form-control mt-1">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="radio"
                name="visibility"
                class="radio radio-sm radio-primary"
                value="private"
                v-model="form.visibility"
              />
              <span class="label-text">Private</span>
            </label>
            <p class="text-xs text-base-content/50 ml-7 -mt-1">
              Hidden from the public website. Only logged-in users can see it.
            </p>
          </div>

          <div class="form-control mt-1">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="radio"
                name="visibility"
                class="radio radio-sm radio-primary"
                value="scheduled"
                v-model="form.visibility"
              />
              <span class="label-text">Scheduled</span>
            </label>
            <p class="text-xs text-base-content/50 ml-7 -mt-1">
              Visible only within a specific date range.
            </p>
          </div>

          <!-- Date range for scheduled visibility -->
          <template v-if="form.visibility === 'scheduled'">
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Visible From</span></label>
              <input
                v-model="form.visible_from"
                type="datetime-local"
                class="input input-bordered input-sm"
              />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Visible To</span></label>
              <input
                v-model="form.visible_to"
                type="datetime-local"
                class="input input-bordered input-sm"
              />
            </div>
          </template>

          <!-- Manually hidden toggle (only for published content) -->
          <div
            v-if="contentStore.currentContent?.status === 'published'"
            class="form-control mt-3 pt-3 border-t border-base-200"
          >
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                class="toggle toggle-sm toggle-error"
                v-model="form.manually_hidden"
              />
              <span class="label-text">Manually Hidden</span>
            </label>
            <p class="text-xs text-base-content/50 ml-11">
              Override: hide this content from the public even if it's published.
            </p>
          </div>
          </div>
        </BaseFormCard>

        <!-- Type-Specific Fields (collapsible) -->
        <BaseFormCard>
          <template #title>
            <button
              class="flex items-center justify-between w-full gap-2 cursor-pointer"
              @click="toggleSection('typeSpecific')"
              :aria-expanded="sidebarSections.typeSpecific"
              aria-controls="section-type-specific"
            >
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 text-base-content/60" />
                <span class="font-medium">{{ typeSpecificTitle }}</span>
              </div>
              <ChevronRight
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.typeSpecific }"
              />
            </button>
          </template>
          <div v-show="sidebarSections.typeSpecific" id="section-type-specific">
          <!-- News Fields -->
          <template v-if="form.type === 'news'">
            <div class="form-control">
              <label class="label"><span class="label-text">Category</span></label>
              <select v-model="form.meta.category_id" class="select select-bordered select-sm">
                <option :value="null">— Select Category —</option>
                <option v-for="cat in taxonomyStore.categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Publication Date</span></label>
              <input v-model="form.meta.published_at" type="date" class="input input-bordered input-sm" />
            </div>
          </template>

          <!-- Event Fields -->
          <template v-if="form.type === 'event'">
            <div class="form-control">
              <label class="label"><span class="label-text">Start Date</span></label>
              <input v-model="form.meta.start_date" type="datetime-local" class="input input-bordered input-sm" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">End Date</span></label>
              <input v-model="form.meta.end_date" type="datetime-local" class="input input-bordered input-sm" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Location</span></label>
              <input v-model="form.meta.location" type="text" class="input input-bordered input-sm" placeholder="e.g. County Hall, Kapenguria" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Event URL</span></label>
              <input v-model="form.meta.event_url" type="url" class="input input-bordered input-sm" placeholder="https://..." />
            </div>
          </template>

          <!-- Tender Fields -->
          <template v-if="form.type === 'tender'">
            <div class="form-control">
              <label class="label"><span class="label-text">Closing Date</span></label>
              <input v-model="form.meta.closing_date" type="datetime-local" class="input input-bordered input-sm" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Reference Number</span></label>
              <input v-model="form.meta.reference_number" type="text" class="input input-bordered input-sm" placeholder="e.g. WPC/T/2026/001" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Tender Document</span></label>
              <div class="flex items-center gap-2">
                <button class="btn btn-xs btn-outline" @click="showMediaPickerFor = 'document'">
                  <FileText class="w-3 h-3" />
                  {{ form.meta.document_id ? 'Change' : 'Select Document' }}
                </button>
                <span v-if="form.meta.document_id" class="text-xs">Document #{{ form.meta.document_id }}</span>
              </div>
            </div>
          </template>

          <!-- Vacancy Fields -->
          <template v-if="form.type === 'vacancy'">
            <div class="form-control">
              <label class="label"><span class="label-text">Job Title</span></label>
              <input v-model="form.meta.job_title" type="text" class="input input-bordered input-sm" placeholder="e.g. Chief Officer, Finance" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Department</span></label>
              <select v-model="form.meta.department_id" class="select select-bordered select-sm">
                <option :value="null">— Select Department —</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
              </select>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Closing Date</span></label>
              <input v-model="form.meta.closing_date" type="datetime-local" class="input input-bordered input-sm" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Attachment</span></label>
              <div class="flex items-center gap-2">
                <button class="btn btn-xs btn-outline" @click="showMediaPickerFor = 'document'">
                  {{ form.meta.document_id ? 'Change' : 'Select Document' }}
                </button>
                <span v-if="form.meta.document_id" class="text-xs">Document #{{ form.meta.document_id }}</span>
              </div>
            </div>
          </template>

          <!-- Department Fields -->
          <template v-if="form.type === 'department'">
            <div class="form-control">
              <label class="label"><span class="label-text">Contact Phone</span></label>
              <input v-model="form.meta.contact_phone" type="text" class="input input-bordered input-sm" placeholder="e.g. +254 20 123456" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Contact Email</span></label>
              <input v-model="form.meta.contact_email" type="email" class="input input-bordered input-sm" placeholder="dept@westpokot.go.ke" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Service Charter</span></label>
              <div class="flex items-center gap-2">
                <button class="btn btn-xs btn-outline" @click="showMediaPickerFor = 'service_charter'">
                  {{ form.meta.service_charter_id ? 'Change' : 'Select Document' }}
                </button>
                <span v-if="form.meta.service_charter_id" class="text-xs">Document #{{ form.meta.service_charter_id }}</span>
              </div>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Sort Order</span></label>
              <input v-model.number="form.meta.sort_order" type="number" min="0" class="input input-bordered input-sm" />
            </div>
          </template>

          <!-- Person Fields -->
          <template v-if="form.type === 'person'">
            <div class="form-control">
              <label class="label"><span class="label-text">Title / Position</span></label>
              <select v-model="form.meta.person_title" class="select select-bordered select-sm">
                <option :value="null">— Select Title —</option>
                <option v-for="t in PERSON_TITLES" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Photo</span></label>
              <div class="flex items-center gap-2">
                <button class="btn btn-xs btn-outline" @click="showMediaPickerFor = 'photo'">
                  {{ form.meta.photo_id ? 'Change' : 'Select Photo' }}
                </button>
                <span v-if="form.meta.photo_id" class="text-xs">Media #{{ form.meta.photo_id }}</span>
              </div>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text">Sort Order</span></label>
              <input v-model.number="form.meta.sort_order" type="number" min="0" class="input input-bordered input-sm" />
            </div>
            <div class="form-control mt-2">
              <div class="flex items-center justify-between">
                <label class="label"><span class="label-text">Social Links</span></label>
                <button class="btn btn-xs btn-outline" @click="addSocialLink">
                  <Plus class="w-3 h-3" />
                  Add
                </button>
              </div>
              <div v-for="(link, idx) in form.meta.social_links" :key="idx" class="flex gap-1 items-start mt-1">
                <select v-model="link.platform" class="select select-bordered select-xs flex-1">
                  <option v-for="p in SOCIAL_PLATFORMS" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
                <input v-model="link.url" type="url" class="input input-bordered input-xs flex-1" placeholder="https://..." />
                <button class="btn btn-ghost btn-xs text-error" @click="removeSocialLink(idx)">
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </template>

          <!-- Page / Department Notice / Press Release - no extra fields -->
          <p v-if="['page', 'department_notice', 'press_release'].includes(form.type)" class="text-sm text-base-content/50">
            No additional fields for this content type.
          </p>
          </div>
        </BaseFormCard>

        <!-- Categories (collapsible) -->
        <BaseFormCard>
          <template #title>
            <button
              class="flex items-center justify-between w-full gap-2 cursor-pointer"
              @click="toggleSection('categories')"
              :aria-expanded="sidebarSections.categories"
              aria-controls="section-categories"
            >
              <div class="flex items-center gap-2">
                <FolderOpen class="w-4 h-4 text-base-content/60" />
                <span class="font-medium">Categories</span>
              </div>
              <ChevronRight
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.categories }"
              />
            </button>
          </template>
          <div v-show="sidebarSections.categories" id="section-categories">
            <div v-if="taxonomyStore.categories.length" class="space-y-1">
              <label
                v-for="cat in taxonomyStore.categories"
                :key="cat.id"
                class="label cursor-pointer justify-start gap-2"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :value="cat.id"
                  :checked="form.taxonomy_ids.includes(cat.id)"
                  @change="
                    form.taxonomy_ids.includes(cat.id)
                      ? form.taxonomy_ids.splice(form.taxonomy_ids.indexOf(cat.id), 1)
                      : form.taxonomy_ids.push(cat.id)
                  "
                />
                <span class="label-text">{{ cat.name }}</span>
              </label>
            </div>
            <p v-else class="text-sm text-base-content/50">No categories available.</p>
          </div>
        </BaseFormCard>

        <!-- Tags (collapsible) -->
        <BaseFormCard>
          <template #title>
            <button
              class="flex items-center justify-between w-full gap-2 cursor-pointer"
              @click="toggleSection('tags')"
              :aria-expanded="sidebarSections.tags"
              aria-controls="section-tags"
            >
              <div class="flex items-center gap-2">
                <Bookmark class="w-4 h-4 text-base-content/60" />
                <span class="font-medium">Tags</span>
              </div>
              <ChevronRight
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.tags }"
              />
            </button>
          </template>
          <div v-show="sidebarSections.tags" id="section-tags">
            <div v-if="taxonomyStore.tags.length" class="flex flex-wrap gap-1">
              <button
                v-for="tag in taxonomyStore.tags"
                :key="tag.id"
                class="badge badge-outline cursor-pointer"
                :class="{ 'badge-primary': form.taxonomy_ids.includes(tag.id) }"
                @click="
                  form.taxonomy_ids.includes(tag.id)
                    ? form.taxonomy_ids.splice(form.taxonomy_ids.indexOf(tag.id), 1)
                    : form.taxonomy_ids.push(tag.id)
                "
              >
                {{ tag.name }}
              </button>
            </div>
            <p v-else class="text-sm text-base-content/50">No tags available.</p>
          </div>
        </BaseFormCard>

        <!-- Media Attachments (collapsible) -->
        <BaseFormCard>
          <template #title>
            <button
              class="flex items-center justify-between w-full gap-2 cursor-pointer"
              @click="toggleSection('media')"
              :aria-expanded="sidebarSections.media"
              aria-controls="section-media"
            >
              <div class="flex items-center gap-2">
                <Paperclip class="w-4 h-4 text-base-content/60" />
                <span class="font-medium">Media</span>
              </div>
              <ChevronRight
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.media }"
              />
            </button>
          </template>
          <div v-show="sidebarSections.media" id="section-media">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs text-base-content/50">Attached files and images</p>
              <button class="btn btn-xs btn-outline" @click="showMediaModal = true" aria-label="Add media">
                <Plus class="w-3 h-3" />
                Add
              </button>
            </div>
            <div v-if="form.media_ids.length" class="space-y-1">
              <div
                v-for="mediaId in form.media_ids"
                :key="mediaId"
                class="flex items-center justify-between text-sm"
              >
                <span>Media #{{ mediaId }}</span>
                <button class="btn btn-ghost btn-xs text-error" @click="removeMedia(mediaId)" :aria-label="`Remove media #${mediaId}`">
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/50">No media attached.</p>
          </div>
        </BaseFormCard>
      </div>
    </div>

    <!-- Media Library Modal (general attachments) -->
    <MediaLibraryModal
      :show="showMediaModal"
      @close="showMediaModal = false"
      @select="handleMediaSelect"
    />

    <!-- Media Library Modal (type-specific field picker) -->
    <MediaLibraryModal
      :show="!!showMediaPickerFor"
      @close="closeMediaPicker"
      @select="handleMediaSelect"
    />

    <!-- Preview Modal -->
    <PreviewModal
      :show="showPreview"
      :content="contentStore.currentContent"
      :locale="previewLocale"
      @close="showPreview = false"
    />

    <!-- AI Action Result Modal -->
    <AIActionModal
      :visible="aiModalVisible"
      :title="aiModalTitle"
      :loading="aiLoading"
      :result="aiResult?.data"
      :error="aiError"
      :cost-kes="aiCostKes"
      :show-accept="aiShowAccept"
      :accept-label="aiAcceptLabel"
      @close="aiModalVisible = false"
      @accept="handleAiAccept"
      @cancel="aiModalVisible = false"
    >
      <template #result>
        <!-- Grammar check result -->
        <GrammarCheck
          v-if="aiResult?.type === 'grammar' && aiResult.data"
          :result="aiResult.data"
          original-label="Original"
          corrected-label="Corrected"
        />

        <!-- Translation result -->
        <div v-else-if="aiResult?.type === 'translate' && aiResult.data" class="space-y-3">
          <div class="alert alert-info text-sm">
            Translated to <strong>{{ aiResult.targetLabel }}</strong>
          </div>
          <div class="p-3 bg-base-200 rounded-box whitespace-pre-wrap text-sm">
            {{ aiResult.data.translatedText }}
          </div>
        </div>

        <!-- Tags result -->
        <TagSuggestion
          v-else-if="aiResult?.type === 'tags' && aiResult.data"
          :tags="aiResult.data.tags || []"
          :model-value="[]"
          :max-select="10"
        />

        <!-- SEO result -->
        <div v-else-if="aiResult?.type === 'seo' && aiResult.data" class="space-y-3">
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Meta Description</span></label>
            <textarea
              class="textarea textarea-bordered text-sm"
              rows="3"
              readonly
              :value="aiResult.data.metaDescription"
            ></textarea>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Meta Keywords</span></label>
            <input
              type="text"
              class="input input-bordered text-sm"
              readonly
              :value="aiResult.data.metaKeywords"
            />
          </div>
        </div>

        <!-- Improve writing result -->
        <div v-else-if="aiResult?.type === 'improve' && aiResult.data" class="space-y-3">
          <div class="p-3 bg-base-200 rounded-box whitespace-pre-wrap text-sm">
            {{ aiResult.data.rewrittenText }}
          </div>
        </div>
      </template>
    </AIActionModal>

  </div>
</template>
