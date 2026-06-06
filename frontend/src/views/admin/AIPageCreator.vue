<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import AIActionModal from '@/components/AIActionModal.vue'
import ContentEditor from '@/components/ContentEditor.vue'
import { improveWriting, suggestSeo, suggestTags } from '@/api/ai'
import { createContent } from '@/api/content'

const emit = defineEmits(['close', 'created'])
const router = useRouter()
const toast = useToast()

// Step management
const currentStep = ref(1)
const totalSteps = 4

// Form data
const form = ref({
  type: 'page',
  slug: '',
  title_en: '',
  title_sw: '',
  title_pok: '',
  body_en: '',
  body_sw: '',
  body_pok: '',
  excerpt_en: '',
  excerpt_sw: '',
  excerpt_pok: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  tags: [],
  locale: 'en',
})

const saving = ref(false)
const saveError = ref(null)

// AI state
const aiLoading = ref(false)
const aiResult = ref('')
const aiError = ref('')
const aiCostKes = ref(0)
const aiModalVisible = ref(false)
const aiModalTitle = ref('')
const currentAiAction = ref('')

// Preview
const previewContent = ref('')

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function onTitleChange() {
  if (!form.value.slug || form.value.slug === generateSlug(form.value.title_en)) {
    form.value.slug = generateSlug(form.value.title_en)
  }
}

// AI Actions
async function handleImproveWriting() {
  if (!form.value.body_en) {
    toast.show('Please enter some content first.', 'warning')
    return
  }
  currentAiAction.value = 'improve'
  aiModalTitle.value = 'Improve Writing'
  aiLoading.value = true
  aiModalVisible.value = true
  try {
    const result = await improveWriting(form.value.body_en, 'Improve the clarity, grammar, and professionalism of this text for a county government website.')
    aiResult.value = result.improved
    aiCostKes.value = result.usage?.costKes || 0
  } catch (err) {
    aiError.value = err.response?.data?.error || err.message
  } finally {
    aiLoading.value = false
  }
}

async function handleSuggestSeo() {
  currentAiAction.value = 'seo'
  aiModalTitle.value = 'Suggest SEO Metadata'
  aiLoading.value = true
  aiModalVisible.value = true
  try {
    const result = await suggestSeo(form.value.title_en, form.value.body_en, form.value.locale)
    aiResult.value = `Meta Title: ${result.metaTitle}\n\nMeta Description: ${result.metaDescription}\n\nMeta Keywords: ${result.metaKeywords}`
    aiCostKes.value = result.usage?.costKes || 0
  } catch (err) {
    aiError.value = err.response?.data?.error || err.message
  } finally {
    aiLoading.value = false
  }
}

async function handleSuggestTags() {
  currentAiAction.value = 'tags'
  aiModalTitle.value = 'Suggest Tags'
  aiLoading.value = true
  aiModalVisible.value = true
  try {
    const result = await suggestTags(form.value.title_en, form.value.body_en, 5)
    aiResult.value = result.tags.join(', ')
    aiCostKes.value = result.usage?.costKes || 0
  } catch (err) {
    aiError.value = err.response?.data?.error || err.message
  } finally {
    aiLoading.value = false
  }
}

function onAiAccept() {
  if (currentAiAction.value === 'improve') {
    form.value.body_en = aiResult.value
  } else if (currentAiAction.value === 'seo') {
    // Parse SEO result
    const lines = aiResult.value.split('\n')
    lines.forEach((line) => {
      if (line.startsWith('Meta Title:')) form.value.meta_title = line.replace('Meta Title:', '').trim()
      if (line.startsWith('Meta Description:')) form.value.meta_description = line.replace('Meta Description:', '').trim()
      if (line.startsWith('Meta Keywords:')) form.value.meta_keywords = line.replace('Meta Keywords:', '').trim()
    })
  } else if (currentAiAction.value === 'tags') {
    form.value.tags = aiResult.value.split(',').map((t) => t.trim()).filter(Boolean)
  }
  aiModalVisible.value = false
  toast.show('AI result applied successfully.', 'success')
}

function onAiCancel() {
  aiModalVisible.value = false
}

// Navigation
function nextStep() {
  if (currentStep.value < totalSteps) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

// Save
async function handleSave() {
  saving.value = true
  saveError.value = null
  try {
    const payload = {
      type: form.value.type,
      slug: form.value.slug,
      status: 'draft',
      visibility: 'public',
      translations: [
        {
          locale: 'en',
          title: form.value.title_en,
          body: form.value.body_en,
          excerpt: form.value.excerpt_en,
          meta_description: form.value.meta_description,
          meta_keywords: form.value.meta_keywords,
        },
      ],
      meta: [
        { meta_key: 'ai_generated', meta_value: 'true' },
        { meta_key: 'meta_title', meta_value: form.value.meta_title },
      ],
    }

    // Add Swahili translation if provided
    if (form.value.title_sw || form.value.body_sw) {
      payload.translations.push({
        locale: 'sw',
        title: form.value.title_sw || '',
        body: form.value.body_sw || '',
        excerpt: form.value.excerpt_sw || '',
      })
    }

    // Add Pokot translation if provided
    if (form.value.title_pok || form.value.body_pok) {
      payload.translations.push({
        locale: 'pok',
        title: form.value.title_pok || '',
        body: form.value.body_pok || '',
        excerpt: form.value.excerpt_pok || '',
      })
    }

    // Add tags as meta
    if (form.value.tags.length > 0) {
      payload.meta.push({ meta_key: 'tags', meta_value: form.value.tags.join(',') })
    }

    const content = await createContent(payload)
    toast.show('Page created successfully!', 'success')
    emit('created', content)
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message
    toast.show(saveError.value, 'error')
  } finally {
    saving.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto" @click.self="handleClose">
    <div class="modal-box max-w-3xl my-8">
      <h3 class="font-bold text-lg mb-2">AI-Powered Page Creator</h3>

      <!-- Steps indicator -->
      <div class="flex gap-2 mb-6">
        <div v-for="s in totalSteps" :key="s" class="flex-1">
          <div
            class="h-2 rounded-full"
            :class="s <= currentStep ? 'bg-primary' : 'bg-base-300'"
          ></div>
          <div class="text-xs text-center mt-1 text-base-content/60">
            {{ ['', 'Details', 'Content', 'SEO & Tags', 'Review'][s] }}
          </div>
        </div>
      </div>

      <div v-if="saveError" class="alert alert-error mb-4">
        <span>{{ saveError }}</span>
      </div>

      <!-- Step 1: Basic Details -->
      <div v-if="currentStep === 1" class="space-y-3">
        <div class="form-control">
          <label class="label"><span class="label-text">Page Type</span></label>
          <select v-model="form.type" class="select select-bordered">
            <option value="page">Page</option>
            <option value="news">News Article</option>
            <option value="event">Event</option>
            <option value="department">Department</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Title (English) *</span></label>
          <input v-model="form.title_en" class="input input-bordered" required placeholder="Page title" @input="onTitleChange" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Title (Swahili)</span></label>
          <input v-model="form.title_sw" class="input input-bordered" placeholder="Kichwa cha habari" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Title (Pokot)</span></label>
          <input v-model="form.title_pok" class="input input-bordered" placeholder="Kokwo" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">URL Slug</span></label>
          <input v-model="form.slug" class="input input-bordered" placeholder="about-us" />
        </div>
      </div>

      <!-- Step 2: Content -->
      <div v-if="currentStep === 2" class="space-y-3">
        <div class="flex gap-2 mb-2">
          <button class="btn btn-sm btn-outline btn-info" @click="handleImproveWriting" :disabled="aiLoading">
            <span v-if="aiLoading" class="loading loading-spinner loading-xs"></span>
            Improve with AI
          </button>
          <button class="btn btn-sm btn-outline btn-info" @click="handleSuggestTags" :disabled="aiLoading">
            Suggest Tags
          </button>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Content (English) *</span></label>
          <ContentEditor v-model="form.body_en" :min-height="200" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Excerpt (English)</span></label>
          <textarea v-model="form.excerpt_en" class="textarea textarea-bordered" rows="2" placeholder="Brief summary..."></textarea>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Content (Swahili)</span></label>
          <ContentEditor v-model="form.body_sw" :min-height="150" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Content (Pokot)</span></label>
          <ContentEditor v-model="form.body_pok" :min-height="150" />
        </div>
      </div>

      <!-- Step 3: SEO & Tags -->
      <div v-if="currentStep === 3" class="space-y-3">
        <div class="flex gap-2 mb-2">
          <button class="btn btn-sm btn-outline btn-info" @click="handleSuggestSeo" :disabled="aiLoading">
            Auto-generate SEO
          </button>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Meta Title</span></label>
          <input v-model="form.meta_title" class="input input-bordered" placeholder="SEO title" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Meta Description</span></label>
          <textarea v-model="form.meta_description" class="textarea textarea-bordered" rows="2" placeholder="SEO description..."></textarea>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Meta Keywords</span></label>
          <input v-model="form.meta_keywords" class="input input-bordered" placeholder="keyword1, keyword2" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Tags</span></label>
          <div class="flex flex-wrap gap-1 mb-1">
            <span v-for="(tag, i) in form.tags" :key="i" class="badge badge-primary gap-1">
              {{ tag }}
              <button class="btn btn-xs btn-ghost btn-circle" @click="form.tags.splice(i, 1)">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="form.tagInput"
              class="input input-bordered input-sm flex-1"
              placeholder="Add a tag"
              @keydown.enter.prevent="form.tagInput && (form.tags.push(form.tagInput), form.tagInput = '')"
            />
            <button
              class="btn btn-sm btn-outline"
              @click="form.tagInput && (form.tags.push(form.tagInput), form.tagInput = '')"
            >Add</button>
          </div>
        </div>
      </div>

      <!-- Step 4: Review & Save -->
      <div v-if="currentStep === 4" class="space-y-3">
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Review your page details before saving. The page will be created as a draft.</span>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <tbody>
              <tr><td class="font-semibold">Type</td><td>{{ form.type }}</td></tr>
              <tr><td class="font-semibold">Slug</td><td>{{ form.slug }}</td></tr>
              <tr><td class="font-semibold">Title (EN)</td><td>{{ form.title_en }}</td></tr>
              <tr><td class="font-semibold">Title (SW)</td><td>{{ form.title_sw || '—' }}</td></tr>
              <tr><td class="font-semibold">Title (POK)</td><td>{{ form.title_pok || '—' }}</td></tr>
              <tr><td class="font-semibold">Tags</td><td>{{ form.tags.length ? form.tags.join(', ') : '—' }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex justify-between mt-6">
        <div>
          <button v-if="currentStep > 1" class="btn btn-ghost" @click="prevStep">Previous</button>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost" @click="handleClose">Cancel</button>
          <button v-if="currentStep < totalSteps" class="btn btn-primary" @click="nextStep">Next</button>
          <button v-else class="btn btn-success" :disabled="saving" @click="handleSave">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            Save as Draft
          </button>
        </div>
      </div>

      <!-- AI Action Modal -->
      <AIActionModal
        :visible="aiModalVisible"
        :title="aiModalTitle"
        :loading="aiLoading"
        :result="aiResult"
        :error="aiError"
        :costKes="aiCostKes"
        showAccept
        acceptLabel="Apply to Content"
        @close="aiModalVisible = false"
        @accept="onAiAccept"
        @cancel="onAiCancel"
      />
    </div>
  </div>
</template>
