<script setup>
/**
 * AIContentAssistantModal.vue - Full modal UI for the AI Content Assistant.
 *
 * Workflow:
 * 1. User chooses input method: URL or File
 * 2. User provides input (URL string or selects a file from their computer)
 * 3. User clicks "Generate Draft"
 * 4. Loading state with progress messages
 * 5. Draft preview appears with editable fields
 * 6. User can "Save as Draft" or "Open in Editor"
 *
 * Emits:
 * - close: close the modal
 * - open-editor: navigate to ContentEditorPage with pre-filled data
 * - draft-saved: notification that draft was saved
 */
import { ref, computed, onMounted } from 'vue'
import { generateFromUrl, generateFromFileUpload } from '../api/aiContentAssistant'
import { useContentStore } from '../stores/content'
import { useTaxonomyStore } from '../stores/taxonomy'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'open-editor', 'draft-saved'])

const router = useRouter()
const contentStore = useContentStore()
const taxonomyStore = useTaxonomyStore()

// ─── Input Mode ───────────────────────────────────────────────
const inputMode = ref('url') // 'url' | 'file'
const url = ref('')
const selectedFile = ref(null) // File object from <input type="file">
const selectedFileName = ref('')

// ─── State ────────────────────────────────────────────────────
const loading = ref(false)
const error = ref('')
const progressMessage = ref('')
const draft = ref(null)
const usage = ref(null)
const step = ref('input') // 'input' | 'preview'

// ─── Editable Draft Fields ────────────────────────────────────
const editType = ref('page')
const editSlug = ref('')
const editTitle = ref('')
const editBody = ref('')
const editExcerpt = ref('')
const editCategories = ref([])
const availableCategories = ref([])

// ─── Progress Messages ────────────────────────────────────────
const progressMessages = {
  url: [
    '🌐 Fetching content from URL...',
    '📄 Extracting meaningful text...',
    '🤖 Analyzing with AI...',
    '✍️ Generating structured draft...',
    '✅ Draft ready!',
  ],
  file: [
    '📂 Uploading file to server...',
    '📄 Extracting text content...',
    '🤖 Analyzing with AI...',
    '✍️ Generating structured draft...',
    '✅ Draft ready!',
  ],
}
const progressIndex = ref(0)
let progressInterval = null

function startProgressAnimation(mode) {
  progressIndex.value = 0
  const msgs = progressMessages[mode]
  progressInterval = setInterval(() => {
    progressIndex.value = Math.min(progressIndex.value + 1, msgs.length - 1)
    progressMessage.value = msgs[progressIndex.value]
  }, 3000)
  progressMessage.value = msgs[0]
}

function stopProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// ─── Computed ─────────────────────────────────────────────────
const canGenerate = computed(() => {
  if (inputMode.value === 'url') {
    return url.value.trim().length > 0 && isValidUrl(url.value)
  }
  return selectedFile.value !== null
})

const contentTypes = [
  { value: 'page', label: 'Page' },
  { value: 'news', label: 'News' },
  { value: 'event', label: 'Event' },
  { value: 'tender', label: 'Tender' },
  { value: 'vacancy', label: 'Vacancy' },
  { value: 'department_notice', label: 'Department Notice' },
  { value: 'press_release', label: 'Press Release' },
]

// ─── Methods ──────────────────────────────────────────────────
function isValidUrl(str) {
  try {
    const parsed = new URL(str)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function handleFileSelected(event) {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile.value = file
    selectedFileName.value = file.name
  }
}

async function handleGenerate() {
  loading.value = true
  error.value = ''
  draft.value = null
  usage.value = null
  step.value = 'input'

  startProgressAnimation(inputMode.value)

  try {
    let result
    if (inputMode.value === 'url') {
      result = await generateFromUrl(url.value.trim())
    } else {
      result = await generateFromFileUpload(selectedFile.value)
    }

    stopProgressAnimation()
    progressMessage.value = progressMessages[inputMode.value][4] // ✅ Draft ready!

    // Populate draft
    draft.value = result.draft
    usage.value = result.usage

    // Populate editable fields
    editType.value = result.draft.type || 'page'
    editSlug.value = result.draft.slug || ''
    editTitle.value = result.draft.translations?.[0]?.title || ''
    editBody.value = result.draft.translations?.[0]?.body || ''
    editExcerpt.value = result.draft.translations?.[0]?.excerpt || ''
    editCategories.value = result.draft.suggested_categories || []

    // Switch to preview step
    step.value = 'preview'
  } catch (err) {
    stopProgressAnimation()
    error.value = err.response?.data?.message || err.message || 'Failed to generate draft.'
    step.value = 'input'
  } finally {
    loading.value = false
  }
}

async function handleSaveAsDraft() {
  loading.value = true
  error.value = ''

  try {
    // Resolve category names to taxonomy IDs
    const taxonomyIds = []
    if (editCategories.value.length > 0) {
      const allTaxonomies = taxonomyStore.taxonomies
      for (const catName of editCategories.value) {
        const found = allTaxonomies.find(
          (t) =>
            t.name.toLowerCase() === catName.toLowerCase() && t.type === 'category'
        )
        if (found) {
          taxonomyIds.push(found.id)
        }
      }
    }

    // Build translations array
    const translations = [
      {
        locale: 'en',
        title: editTitle.value,
        body: editBody.value,
        excerpt: editExcerpt.value,
      },
    ]

    // Build meta array from draft meta + source info
    const meta = draft.value?.meta || []
    if (inputMode.value === 'url' && url.value.trim()) {
      // Ensure source_url is in meta
      const hasSourceUrl = meta.some((m) => m.meta_key === 'source_url')
      if (!hasSourceUrl) {
        meta.push({ meta_key: 'source_url', meta_value: url.value.trim() })
      }
    }

    const contentData = {
      type: editType.value,
      slug: editSlug.value,
      translations,
      meta,
      taxonomy_ids: taxonomyIds,
      visibility: 'public',
    }

    await contentStore.createContent(contentData)
    emit('draft-saved')
    handleClose()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to save draft.'
  } finally {
    loading.value = false
  }
}

function handleOpenInEditor() {
  // Build query params to pre-fill the editor
  const params = new URLSearchParams()
  params.set('type', editType.value)
  params.set('slug', editSlug.value)
  params.set('title', editTitle.value)
  params.set('body', editBody.value)
  params.set('excerpt', editExcerpt.value)
  if (editCategories.value.length > 0) {
    params.set('categories', editCategories.value.join(','))
  }
  if (inputMode.value === 'url' && url.value.trim()) {
    params.set('source_url', url.value.trim())
  }

  emit('open-editor', `/admin/content/editor?${params.toString()}`)
  handleClose()
}

function handleClose() {
  resetState()
  emit('close')
}

function handleBackdropClick() {
  if (!loading.value) {
    handleClose()
  }
}

function resetState() {
  url.value = ''
  selectedFile.value = null
  selectedFileName.value = ''
  loading.value = false
  error.value = ''
  draft.value = null
  usage.value = null
  step.value = 'input'
  editType.value = 'page'
  editSlug.value = ''
  editTitle.value = ''
  editBody.value = ''
  editExcerpt.value = ''
  editCategories.value = []
  stopProgressAnimation()
  progressMessage.value = ''
}

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(async () => {
  await taxonomyStore.fetchTaxonomies()
})
</script>

<template>
  <dialog
    :open="visible"
    class="modal"
    :class="{ 'modal-open': visible }"
    @click.self="handleBackdropClick"
  >
    <div class="modal-box max-w-4xl min-h-[60vh]">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <span class="text-lg">🤖</span>
          AI Content Assistant
        </h3>
        <button
          class="btn btn-sm btn-ghost btn-square"
          :disabled="loading"
          @click="handleClose"
        >
          ✕
        </button>
      </div>

      <!-- ════════════════════════════════════════════════════════
           STEP 1: INPUT
           ════════════════════════════════════════════════════════ -->
      <div v-if="step === 'input' && !loading" class="space-y-6">
        <!-- Input Mode Tabs -->
        <div role="tablist" class="tabs tabs-boxed">
          <a
            role="tab"
            class="tab"
            :class="{ 'tab-active': inputMode === 'url' }"
            @click="inputMode = 'url'"
          >🌐 From URL</a>
          <a
            role="tab"
            class="tab"
            :class="{ 'tab-active': inputMode === 'file' }"
            @click="inputMode = 'file'"
          >📂 From File</a>
        </div>

        <!-- URL Input -->
        <div v-if="inputMode === 'url'" class="space-y-2">
          <label class="label">
            <span class="label-text">Enter the URL of the content to analyze</span>
          </label>
          <input
            v-model="url"
            type="url"
            placeholder="https://example.com/article"
            class="input input-bordered w-full"
            @keyup.enter="handleGenerate"
          />
          <p class="text-xs text-base-content/50">
            The AI will scrape the page, extract text, and generate a structured draft.
          </p>
        </div>

        <!-- File Input -->
        <div v-if="inputMode === 'file'" class="space-y-4">
          <label class="label">
            <span class="label-text">Upload a file from your computer (TXT, PDF, or DOCX)</span>
          </label>

          <!-- File upload drop zone -->
          <div
            class="border-2 border-dashed border-base-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
            @click="$refs.fileInput?.click()"
            @dragover.prevent="$event.currentTarget.classList.add('border-primary')"
            @dragleave.prevent="$event.currentTarget.classList.remove('border-primary')"
            @drop.prevent="
              $event.currentTarget.classList.remove('border-primary');
              const file = $event.dataTransfer.files[0];
              if (file) { selectedFile = file; selectedFileName = file.name; }
            "
          >
            <template v-if="!selectedFile">
              <div class="text-4xl mb-3">📁</div>
              <p class="font-medium text-base-content/70">Click to browse or drag & drop</p>
              <p class="text-sm text-base-content/40 mt-1">TXT, PDF, or DOCX files up to 10MB</p>
            </template>
            <template v-else>
              <div class="text-4xl mb-3">📄</div>
              <p class="font-medium text-success">{{ selectedFileName }}</p>
              <button
                class="btn btn-xs btn-ghost mt-2"
                @click.stop="selectedFile = null; selectedFileName = ''"
              >
                Remove
              </button>
            </template>
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            class="hidden"
            @change="handleFileSelected"
          />

          <p class="text-xs text-base-content/50">
            The file will be uploaded to the server, text will be extracted, and the AI will generate a structured draft.
          </p>
        </div>

        <!-- Error display -->
        <div v-if="error" class="alert alert-error">
          <span>⚠️ {{ error }}</span>
        </div>

        <!-- Generate button -->
        <div class="flex justify-end gap-2">
          <button class="btn btn-ghost" @click="handleClose">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!canGenerate"
            @click="handleGenerate"
          >
            🚀 Generate Draft
          </button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════════
           LOADING STATE
           ════════════════════════════════════════════════════════ -->
      <div v-if="loading" class="flex flex-col items-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="mt-6 text-base-content/70 font-medium">{{ progressMessage }}</p>
        <p class="mt-2 text-sm text-base-content/40">
          This may take 30-60 seconds depending on content size.
        </p>
      </div>

      <!-- ════════════════════════════════════════════════════════
           STEP 2: PREVIEW
           ════════════════════════════════════════════════════════ -->
      <div v-if="step === 'preview' && draft && !loading" class="space-y-6">
        <!-- Draft Preview Header -->
        <div class="flex items-center justify-between">
          <span class="badge badge-success gap-1">✅ Draft generated successfully</span>
          <span v-if="usage" class="text-xs text-base-content/50">
            Cost: KES {{ usage.costKes?.toFixed(2) }} | Tokens: {{ usage.inputTokens }} in / {{ usage.outputTokens }} out
          </span>
        </div>

        <!-- Editable Draft Fields -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Left: Main content -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Title -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Title (English)</span>
              </label>
              <input
                v-model="editTitle"
                type="text"
                class="input input-bordered"
                placeholder="Content title"
              />
            </div>

            <!-- Body -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Body (HTML)</span>
              </label>
              <textarea
                v-model="editBody"
                class="textarea textarea-bordered font-mono text-sm min-h-[200px]"
                placeholder="Content body (HTML supported)"
              ></textarea>
            </div>

            <!-- Excerpt -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Excerpt / Summary</span>
              </label>
              <textarea
                v-model="editExcerpt"
                class="textarea textarea-bordered text-sm"
                rows="3"
                placeholder="Brief summary (max 300 chars)"
                maxlength="300"
              ></textarea>
            </div>
          </div>

          <!-- Right: Metadata -->
          <div class="space-y-4">
            <!-- Content Type -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Content Type</span>
              </label>
              <select v-model="editType" class="select select-bordered">
                <option
                  v-for="ct in contentTypes"
                  :key="ct.value"
                  :value="ct.value"
                >
                  {{ ct.label }}
                </option>
              </select>
            </div>

            <!-- Slug -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">URL Slug</span>
              </label>
              <input
                v-model="editSlug"
                type="text"
                class="input input-bordered"
                placeholder="url-friendly-slug"
              />
            </div>

            <!-- Suggested Categories -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Suggested Categories</span>
              </label>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="cat in editCategories"
                  :key="cat"
                  class="badge badge-outline badge-sm"
                >
                  {{ cat }}
                </span>
              </div>
              <p class="text-xs text-base-content/40 mt-1">
                Categories will be matched to existing taxonomy entries when saving.
              </p>
            </div>

            <!-- Source info -->
            <div v-if="inputMode === 'url' && url" class="text-xs text-base-content/50 bg-base-200 rounded-lg p-3">
              <strong>Source:</strong><br />
              <span class="break-all">{{ url }}</span>
            </div>
          </div>
        </div>

        <!-- Error display -->
        <div v-if="error" class="alert alert-error">
          <span>⚠️ {{ error }}</span>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center border-t pt-4">
          <button class="btn btn-ghost btn-sm" @click="step = 'input'">
            ← Back to input
          </button>
          <div class="flex gap-2">
            <button
              class="btn btn-outline btn-primary"
              :disabled="loading"
              @click="handleOpenInEditor"
            >
              ✏️ Open in Editor
            </button>
            <button
              class="btn btn-primary"
              :disabled="loading"
              @click="handleSaveAsDraft"
            >
              💾 Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <form method="dialog" class="modal-backdrop">
      <button @click="handleClose" :disabled="loading">close</button>
    </form>
  </dialog>
</template>
