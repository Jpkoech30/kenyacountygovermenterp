<script setup>
/**
 * PersonaWizardPage.vue — 4-step wizard for creating persona-based county staff.
 * Step 1: Select persona template
 * Step 2: Person details (name, title, photo, bio, department)
 * Step 3: User account (email, role, password options)
 * Step 4: Review & Create
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchPersonaTemplates, runPersonaWizard } from '../../api/persona'
import { fetchDepartments } from '../../api/public'
import { useToast } from '../../composables/useToast'
import MediaLibraryModal from '../../components/MediaLibraryModal.vue'
import {
  ChevronLeft, ChevronRight, Check, UserCircle, Mail, Shield, FileText, Sparkles, X, Image
} from '@lucide/vue'

const router = useRouter()
const { addToast } = useToast()

// ── Data ──
const templates = ref([])
const roles = ref([])
const departments = ref([])
const loading = ref(true)
const submitting = ref(false)
const showMediaModal = ref(false)

// Wizard state
const currentStep = ref(1)
const totalSteps = 4

const selectedTemplate = ref(null)
const personForm = ref({
  name: '',
  title: '',
  photo_id: null,
  photo_url: '',
  bio_en: '',
  bio_sw: '',
  bio_pok: '',
  sort_order: 0,
  social_links: '{}',
  department_id: null,
})
const userForm = ref({
  create_user: false,
  email: '',
  role_id: null,
  auto_generate_password: true,
  password: '',
  send_email: true,
})
const createContent = ref(true)

// ── Computed ──
const selectedTemplateData = computed(() => {
  if (!selectedTemplate.value) return null
  return templates.value.find((t) => t.key === selectedTemplate.value) || null
})

const selectedDepartmentName = computed(() => {
  if (!personForm.value.department_id) return ''
  const dept = departments.value.find((d) => d.id === personForm.value.department_id)
  return dept ? dept.name : ''
})

const autoTitle = computed(() => {
  const tpl = selectedTemplateData.value
  if (!tpl || !tpl.defaultTitle) return personForm.value.title
  return tpl.defaultTitle.replace('{department_name}', selectedDepartmentName.value || 'Department')
})

const defaultRoleId = computed(() => {
  const tpl = selectedTemplateData.value
  if (!tpl || !tpl.defaultRole) return null
  const role = roles.value.find((r) => r.name === tpl.defaultRole)
  return role ? role.id : null
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!selectedTemplate.value
    case 2: return personForm.value.name.trim().length > 0
    case 3: return !userForm.value.create_user || userForm.value.email.trim().length > 0
    default: return true
  }
})

// ── Methods ──
async function loadData() {
  loading.value = true
  try {
    const [tplRes, deptRes] = await Promise.all([
      fetchPersonaTemplates(),
      fetchDepartments(),
    ])
    templates.value = tplRes.templates || []
    roles.value = tplRes.roles || []
    departments.value = deptRes || []
  } catch (err) {
    addToast('Failed to load wizard data.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function selectTemplate(key) {
  selectedTemplate.value = key
  const tpl = templates.value.find((t) => t.key === key)
  if (tpl) {
    createContent.value = tpl.createContent
    if (tpl.defaultTitle) {
      personForm.value.title = tpl.defaultTitle
    }
    if (tpl.createUser) {
      userForm.value.create_user = true
      if (tpl.defaultRole) {
        const role = roles.value.find((r) => r.name === tpl.defaultRole)
        if (role) userForm.value.role_id = role.id
      }
    }
  }
}

function nextStep() {
  if (currentStep.value < totalSteps && canProceed.value) {
    // Auto-fill title from template on step 2
    if (currentStep.value === 1 && selectedTemplateData.value?.defaultTitle) {
      personForm.value.title = autoTitle.value
    }
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function getInitials(name) {
  if (!name || !name.trim()) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function selectPhoto(media) {
  personForm.value.photo_id = media.id
  personForm.value.photo_url = media.disk_filename
  showMediaModal.value = false
}

function removePhoto() {
  personForm.value.photo_id = null
  personForm.value.photo_url = ''
}

async function handleSubmit() {
  submitting.value = true
  try {
    let socialLinks = null
    try {
      socialLinks = JSON.parse(personForm.value.social_links)
    } catch { socialLinks = null }

    const payload = {
      template: selectedTemplate.value,
      person: {
        name: personForm.value.name,
        title: personForm.value.title || autoTitle.value,
        photo_id: personForm.value.photo_id,
        bio_en: personForm.value.bio_en || null,
        bio_sw: personForm.value.bio_sw || null,
        bio_pok: personForm.value.bio_pok || null,
        sort_order: personForm.value.sort_order || 0,
        social_links: socialLinks,
        department_id: personForm.value.department_id || null,
      },
      create_content: createContent.value,
      user: userForm.value.create_user
        ? {
            email: userForm.value.email,
            role_id: userForm.value.role_id || defaultRoleId.value,
            auto_generate_password: userForm.value.auto_generate_password,
            password: userForm.value.auto_generate_password ? undefined : userForm.value.password,
            send_email: userForm.value.send_email,
          }
        : null,
    }

    await runPersonaWizard(payload)
    addToast('Staff member created successfully!', 'success')
    router.push({ name: 'StaffDirectory' })
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to create staff member.', 'error')
  } finally {
    submitting.value = false
  }
}

// ── Step indicator ──
const steps = [
  { num: 1, label: 'Persona', icon: Sparkles },
  { num: 2, label: 'Details', icon: UserCircle },
  { num: 3, label: 'Account', icon: Mail },
  { num: 4, label: 'Review', icon: FileText },
]
</script>

<template>
  <div class="content-section">
    <div class="content-section-header">
      <h2 class="content-section-title">Create Staff Member</h2>
      <p class="text-sm text-base-content/60">Wizard — {{ steps[currentStep - 1]?.label }}</p>
    </div>

    <!-- Step Indicator -->
    <div class="flex items-center justify-center gap-2 mb-8">
      <template v-for="(step, idx) in steps" :key="step.num">
        <div
          class="flex items-center gap-2"
          :class="{ 'text-primary font-semibold': currentStep >= step.num, 'text-base-content/40': currentStep < step.num }"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            :class="currentStep >= step.num ? 'bg-primary text-white' : 'bg-base-300 text-base-content/50'"
          >
            <component :is="step.icon" v-if="currentStep > step.num" class="w-4 h-4" />
            <span v-else>{{ step.num }}</span>
          </div>
          <span class="text-xs hidden sm:inline">{{ step.label }}</span>
        </div>
        <div
          v-if="idx < steps.length - 1"
          class="h-px w-8 sm:w-12 transition-colors duration-300"
          :class="currentStep > step.num ? 'bg-primary' : 'bg-base-300'"
        />
      </template>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Step 1: Persona Template Selection -->
    <div v-else-if="currentStep === 1" class="space-y-4">
      <p class="text-sm text-base-content/60 mb-4">Select a staff persona template. This will pre-fill default settings for the staff member's role and account.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="tpl in templates"
          :key="tpl.key"
          @click="selectTemplate(tpl.key)"
          class="text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md"
          :class="selectedTemplate === tpl.key ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-300 bg-base-100 hover:border-base-content/30'"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="selectedTemplate === tpl.key ? 'bg-primary text-white' : 'bg-base-200 text-base-content/60'"
            >
              <UserCircle class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-sm">{{ tpl.label }}</h3>
              <p class="text-xs text-base-content/60 mt-0.5 line-clamp-2">{{ tpl.description }}</p>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span v-if="tpl.createUser" class="badge badge-xs badge-primary gap-1">
                  <Shield class="w-3 h-3" /> Account
                </span>
                <span v-if="tpl.createContent" class="badge badge-xs badge-ghost gap-1">
                  <FileText class="w-3 h-3" /> Page
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Step 2: Person Details -->
    <div v-else-if="currentStep === 2" class="space-y-5 max-w-2xl">
      <!-- Photo -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
          <img v-if="personForm.photo_url" :src="`/media/${personForm.photo_url}`" alt="Photo" class="w-full h-full object-cover" />
          <span v-else class="text-lg font-bold text-primary">{{ getInitials(personForm.name || '?') }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="showMediaModal = true" class="btn btn-outline btn-sm gap-2">
            <Image class="w-4 h-4" /> Choose Photo
          </button>
          <button v-if="personForm.photo_id" @click="removePhoto" class="btn btn-ghost btn-sm btn-square">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="form-control sm:col-span-2">
          <label class="label"><span class="label-text">Full Name *</span></label>
          <input v-model="personForm.name" type="text" class="input input-bordered" placeholder="e.g., John Doe" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Title</span></label>
          <input v-model="personForm.title" type="text" class="input input-bordered" :placeholder="autoTitle || 'e.g., CEC — Finance'" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Department</span></label>
          <select v-model="personForm.department_id" class="select select-bordered">
            <option :value="null">None</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Sort Order</span></label>
          <input v-model.number="personForm.sort_order" type="number" class="input input-bordered" min="0" />
        </div>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Bio (English)</span></label>
        <textarea v-model="personForm.bio_en" class="textarea textarea-bordered h-20" placeholder="Brief biography..." />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label"><span class="label-text">Bio (Swahili)</span></label>
          <textarea v-model="personForm.bio_sw" class="textarea textarea-bordered h-20" placeholder="Wasifu kwa Kiswahili..." />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Bio (Pokot)</span></label>
          <textarea v-model="personForm.bio_pok" class="textarea textarea-bordered h-20" placeholder="Ng'alekta..." />
        </div>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Social Links (JSON)</span></label>
        <textarea v-model="personForm.social_links" class="textarea textarea-bordered h-16 font-mono text-xs" placeholder='{"twitter":"https://...","linkedin":"https://..."}' />
      </div>
    </div>

    <!-- Step 3: User Account -->
    <div v-else-if="currentStep === 3" class="space-y-5 max-w-xl">
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input v-model="userForm.create_user" type="checkbox" class="checkbox checkbox-primary" />
          <span class="label-text">Create ERP User Account</span>
        </label>
        <p class="text-xs text-base-content/50 ml-8">If enabled, the staff member will get login credentials for the ERP system.</p>
      </div>

      <template v-if="userForm.create_user">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text">Email Address *</span></label>
            <input v-model="userForm.email" type="email" class="input input-bordered" placeholder="e.g., john.doe@westpokot.go.ke" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Role</span></label>
            <select v-model="userForm.role_id" class="select select-bordered">
              <option :value="null">Select role...</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Department</span></label>
            <select v-model="personForm.department_id" class="select select-bordered">
              <option :value="null">None</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="userForm.auto_generate_password" type="checkbox" class="checkbox checkbox-primary" />
            <span class="label-text">Auto-generate password</span>
          </label>
        </div>

        <div v-if="!userForm.auto_generate_password" class="form-control">
          <label class="label"><span class="label-text">Password</span></label>
          <input v-model="userForm.password" type="text" class="input input-bordered" placeholder="Set a password..." />
        </div>

        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="userForm.send_email" type="checkbox" class="checkbox checkbox-primary" />
            <span class="label-text">Send welcome email with credentials</span>
          </label>
        </div>
      </template>
    </div>

    <!-- Step 4: Review & Create -->
    <div v-else-if="currentStep === 4" class="space-y-5 max-w-2xl">
      <div class="bg-base-200/50 rounded-xl p-5 space-y-4 border border-base-300">
        <h3 class="font-semibold flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-primary" />
          Review Summary
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Persona Template</span>
            <span class="font-medium">{{ selectedTemplateData?.label || 'Custom' }}</span>
          </div>
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Name</span>
            <span class="font-medium">{{ personForm.name || '—' }}</span>
          </div>
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Title</span>
            <span>{{ personForm.title || autoTitle || '—' }}</span>
          </div>
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Department</span>
            <span>{{ selectedDepartmentName || '—' }}</span>
          </div>
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Create Content Page</span>
            <span :class="createContent ? 'text-success' : 'text-base-content/50'">{{ createContent ? 'Yes' : 'No' }}</span>
          </div>
          <div>
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Create User Account</span>
            <span :class="userForm.create_user ? 'text-success' : 'text-base-content/50'">{{ userForm.create_user ? 'Yes' : 'No' }}</span>
          </div>
          <div v-if="userForm.create_user">
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Email</span>
            <span>{{ userForm.email || '—' }}</span>
          </div>
          <div v-if="userForm.create_user && userForm.role_id">
            <span class="text-base-content/50 block text-xs uppercase tracking-wider">Role</span>
            <span>{{ roles.find((r) => r.id === userForm.role_id)?.name || '—' }}</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="prevStep" class="btn btn-outline gap-2">
          <ChevronLeft class="w-4 h-4" /> Back
        </button>
        <button
          @click="handleSubmit"
          class="btn btn-primary gap-2"
          :class="{ loading: submitting }"
          :disabled="submitting"
        >
          <Check v-if="!submitting" class="w-4 h-4" />
          {{ submitting ? 'Creating...' : 'Create Staff Member' }}
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <div v-if="currentStep < 4" class="flex justify-between mt-8 pt-4 border-t border-base-300">
      <button
        v-if="currentStep > 1"
        @click="prevStep"
        class="btn btn-outline btn-sm gap-2"
      >
        <ChevronLeft class="w-4 h-4" /> Back
      </button>
      <div v-else />
      <button
        @click="nextStep"
        class="btn btn-primary btn-sm gap-2"
        :disabled="!canProceed"
      >
        Continue <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Media Library Modal -->
    <MediaLibraryModal
      v-if="showMediaModal"
      @close="showMediaModal = false"
      @select="selectPhoto"
    />
  </div>
</template>
