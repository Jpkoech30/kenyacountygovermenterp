<script setup>
/**
 * EmployeeCreatePage.vue — 4-step wizard for creating/editing employees.
 * Step 1: Personal Information
 * Step 2: Contact & Statutory
 * Step 3: Employment Details
 * Step 4: Review & Submit
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHrStore } from '../../../stores/hr'
import { useToast } from '../../../composables/useToast'
import {
  ChevronLeft, ChevronRight, Check, UserCircle, Mail, FileText, Briefcase, Sparkles,
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const hrStore = useHrStore()
const { addToast } = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const departments = ref([])
const positions = ref([])
const employees = ref([])

// Wizard state
const currentStep = ref(1)
const totalSteps = 4

const form = ref({
  first_name: '',
  last_name: '',
  national_id: '',
  birth_date: '',
  gender: '',
  marital_status: '',
  phone: '',
  email: '',
  personal_email: '',
  position_id: '',
  department_id: '',
  employment_type: 'permanent',
  contract_start_date: '',
  contract_end_date: '',
  supervisor_id: '',
  bank_account: '',
  kra_pin: '',
  nssf_no: '',
  nhif_no: '',
})

const steps = [
  { num: 1, label: 'Personal Info', icon: UserCircle },
  { num: 2, label: 'Contact & Statutory', icon: Mail },
  { num: 3, label: 'Employment', icon: Briefcase },
  { num: 4, label: 'Review', icon: FileText },
]

onMounted(async () => {
  loading.value = true
  try {
    const { default: api } = await import('../../../api/axios')
    const [deptRes, posRes, empRes] = await Promise.all([
      api.get('/api/departments'),
      api.get('/api/positions'),
      hrStore.fetchEmployees({ limit: 500 }),
    ])
    departments.value = deptRes.data.departments || []
    positions.value = posRes.data || []
    employees.value = hrStore.employees || []

    if (isEdit.value) {
      await hrStore.fetchEmployee(parseInt(route.params.id))
      if (hrStore.currentEmployee) {
        const e = hrStore.currentEmployee
        form.value = {
          first_name: e.first_name || '',
          last_name: e.last_name || '',
          national_id: e.national_id || '',
          birth_date: e.birth_date ? e.birth_date.split('T')[0] : '',
          gender: e.gender || '',
          marital_status: e.marital_status || '',
          phone: e.phone || '',
          email: e.email || '',
          personal_email: e.personal_email || '',
          position_id: e.position_id || '',
          department_id: e.department_id || '',
          employment_type: e.employment_type || 'permanent',
          contract_start_date: e.contract_start_date ? e.contract_start_date.split('T')[0] : '',
          contract_end_date: e.contract_end_date ? e.contract_end_date.split('T')[0] : '',
          supervisor_id: e.supervisor_id || '',
          bank_account: e.bank_account || '',
          kra_pin: e.kra_pin || '',
          nssf_no: e.nssf_no || '',
          nhif_no: e.nhif_no || '',
        }
      }
    }
  } catch (err) {
    addToast('Failed to load form data', 'error')
  } finally {
    loading.value = false
  }
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return form.value.first_name.trim() && form.value.last_name.trim() && form.value.national_id.trim()
    case 2: return true // all fields optional
    case 3: return true // all fields optional
    default: return true
  }
})

function nextStep() {
  if (currentStep.value < totalSteps && canProceed.value) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

const selectedDepartmentName = computed(() => {
  if (!form.value.department_id) return ''
  const d = departments.value.find((d) => d.id === parseInt(form.value.department_id))
  return d ? d.name : ''
})

const selectedPositionTitle = computed(() => {
  if (!form.value.position_id) return ''
  const p = positions.value.find((p) => p.id === parseInt(form.value.position_id))
  return p ? p.title : ''
})

const selectedSupervisorName = computed(() => {
  if (!form.value.supervisor_id) return ''
  const e = employees.value.find((e) => e.id === parseInt(form.value.supervisor_id))
  return e ? `${e.first_name} ${e.last_name}` : ''
})

async function handleSubmit() {
  if (!form.value.first_name || !form.value.last_name || !form.value.national_id) {
    addToast('First name, last name, and national ID are required', 'warning')
    return
  }
  saving.value = true
  try {
    const payload = { ...form.value }
    for (const key of ['position_id', 'department_id', 'supervisor_id', 'contract_end_date', 'personal_email', 'bank_account', 'kra_pin', 'nssf_no', 'nhif_no']) {
      if (payload[key] === '') payload[key] = null
    }
    if (payload.position_id) payload.position_id = parseInt(payload.position_id)
    if (payload.department_id) payload.department_id = parseInt(payload.department_id)
    if (payload.supervisor_id) payload.supervisor_id = parseInt(payload.supervisor_id)

    if (isEdit.value) {
      await hrStore.updateEmployee(parseInt(route.params.id), payload)
      addToast('Employee updated successfully', 'success')
    } else {
      await hrStore.createEmployee(payload)
      addToast('Employee created successfully', 'success')
    }
    router.push('/admin/hr/employees')
  } catch (err) {
    addToast(err.response?.data?.error || 'Failed to save employee', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit Employee' : 'Create Employee' }}</h1>
          <p class="text-sm text-base-content/60">
            Wizard — {{ steps[currentStep - 1]?.label }}
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push('/admin/hr/employees')">Back</button>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center justify-center gap-2 mb-6">
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

      <!-- Step 1: Personal Information -->
      <div v-if="currentStep === 1" class="max-w-2xl space-y-4">
        <p class="text-sm text-base-content/60">Enter the employee's basic personal details.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text">First Name *</span></label>
            <input v-model="form.first_name" type="text" class="input input-bordered" placeholder="e.g., John" />
          </div>
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text">Last Name *</span></label>
            <input v-model="form.last_name" type="text" class="input input-bordered" placeholder="e.g., Doe" />
          </div>
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text">National ID *</span></label>
            <input v-model="form.national_id" type="text" class="input input-bordered" placeholder="e.g., 12345678" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Date of Birth</span></label>
            <input v-model="form.birth_date" type="date" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Gender</span></label>
            <select v-model="form.gender" class="select select-bordered">
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Marital Status</span></label>
            <select v-model="form.marital_status" class="select select-bordered">
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Step 2: Contact & Statutory -->
      <div v-else-if="currentStep === 2" class="max-w-2xl space-y-5">
        <div class="bg-base-200/50 rounded-xl p-4 border border-base-300">
          <h3 class="font-semibold text-sm mb-3 flex items-center gap-2">
            <Mail class="w-4 h-4 text-primary" /> Contact Information
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Phone</span></label>
              <input v-model="form.phone" type="tel" class="input input-bordered" placeholder="+254..." />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Work Email</span></label>
              <input v-model="form.email" type="email" class="input input-bordered" placeholder="john.doe@westpokot.go.ke" />
            </div>
            <div class="form-control sm:col-span-2">
              <label class="label"><span class="label-text">Personal Email</span></label>
              <input v-model="form.personal_email" type="email" class="input input-bordered" placeholder="john@gmail.com" />
            </div>
          </div>
        </div>

        <div class="bg-base-200/50 rounded-xl p-4 border border-base-300">
          <h3 class="font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" /> Statutory Information
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">KRA PIN</span></label>
              <input v-model="form.kra_pin" type="text" class="input input-bordered" placeholder="P000..." />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">NSSF No.</span></label>
              <input v-model="form.nssf_no" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">NHIF No.</span></label>
              <input v-model="form.nhif_no" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Bank Account</span></label>
              <input v-model="form.bank_account" type="text" class="input input-bordered" placeholder="Bank / Account No." />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Employment Details -->
      <div v-else-if="currentStep === 3" class="max-w-2xl space-y-4">
        <p class="text-sm text-base-content/60">Set the employee's position, department, and contract information.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Department</span></label>
            <select v-model="form.department_id" class="select select-bordered">
              <option value="">Select...</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Position</span></label>
            <select v-model="form.position_id" class="select select-bordered">
              <option value="">Select...</option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Employment Type</span></label>
            <select v-model="form.employment_type" class="select select-bordered">
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="probation">Probation</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Supervisor</span></label>
            <select v-model="form.supervisor_id" class="select select-bordered">
              <option value="">None</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.first_name }} {{ emp.last_name }}
              </option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Contract Start Date</span></label>
            <input v-model="form.contract_start_date" type="date" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Contract End Date</span></label>
            <input v-model="form.contract_end_date" type="date" class="input input-bordered" />
          </div>
        </div>
      </div>

      <!-- Step 4: Review & Submit -->
      <div v-else-if="currentStep === 4" class="space-y-5 max-w-2xl">
        <div class="bg-base-200/50 rounded-xl p-5 space-y-4 border border-base-300">
          <h3 class="font-semibold flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            Review Summary
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">First Name</span>
              <span class="font-medium">{{ form.first_name || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Last Name</span>
              <span class="font-medium">{{ form.last_name || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">National ID</span>
              <span>{{ form.national_id || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Date of Birth</span>
              <span>{{ form.birth_date || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Gender</span>
              <span>{{ form.gender || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Marital Status</span>
              <span>{{ form.marital_status || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Phone</span>
              <span>{{ form.phone || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Work Email</span>
              <span>{{ form.email || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Personal Email</span>
              <span>{{ form.personal_email || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">KRA PIN</span>
              <span>{{ form.kra_pin || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">NSSF No.</span>
              <span>{{ form.nssf_no || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">NHIF No.</span>
              <span>{{ form.nhif_no || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Bank Account</span>
              <span>{{ form.bank_account || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Department</span>
              <span>{{ selectedDepartmentName || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Position</span>
              <span>{{ selectedPositionTitle || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Employment Type</span>
              <span>{{ form.employment_type || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Supervisor</span>
              <span>{{ selectedSupervisorName || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Contract Start</span>
              <span>{{ form.contract_start_date || '—' }}</span>
            </div>
            <div>
              <span class="text-base-content/50 block text-xs uppercase tracking-wider">Contract End</span>
              <span>{{ form.contract_end_date || '—' }}</span>
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
            :class="{ loading: saving }"
            :disabled="saving"
          >
            <Check v-if="!saving" class="w-4 h-4" />
            {{ saving ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee' }}
          </button>
        </div>
      </div>

      <!-- Navigation (steps 1-3) -->
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
    </template>
  </div>
</template>
