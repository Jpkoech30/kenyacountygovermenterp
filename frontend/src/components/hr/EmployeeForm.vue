<script setup>
/**
 * EmployeeForm.vue
 * Create/Edit employee form for HR officers.
 * Refactored to use vee-validate + Yup + BaseInput/BaseSelect components.
 */
import { ref, computed, onMounted } from 'vue'
import api from '../../api/axios'
import * as yup from 'yup'
import { useFormValidation } from '../../composables/useFormValidation'
import BaseInput from '../forms/BaseInput.vue'
import BaseSelect from '../forms/BaseSelect.vue'

const props = defineProps({
  employee: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])

const positions = ref([])
const departments = ref([])
const supervisors = ref([])
const saving = ref(false)
const error = ref('')

const isEditing = computed(() => !!props.employee)

// Yup validation schema
const schema = yup.object({
  first_name: yup.string().trim().required('First name is required'),
  last_name: yup.string().trim().required('Last name is required'),
  national_id: yup
    .string()
    .matches(/^\d{8}$/, 'National ID must be exactly 8 digits')
    .required('National ID is required'),
  birth_date: yup.date().max(new Date(), 'Date of birth cannot be in the future'),
  gender: yup.string().oneOf(['male', 'female', 'other']),
  marital_status: yup.string().oneOf(['single', 'married', 'divorced', 'widowed']),
  phone: yup.string().matches(/^(07|01)\d{8}$/, 'Phone must be a valid Kenyan number'),
  email: yup.string().email('Invalid email format'),
  personal_email: yup.string().email('Invalid email format'),
  position_id: yup.string(),
  department_id: yup.string(),
  employment_type: yup.string().required('Employment type is required'),
  contract_start_date: yup.date().required('Contract start date is required'),
  contract_end_date: yup.date().min(yup.ref('contract_start_date'), 'End date must be after start date'),
  supervisor_id: yup.string(),
  bank_account: yup.string(),
  kra_pin: yup.string(),
  nssf_no: yup.string(),
  nhif_no: yup.string(),
})

const { handleSubmit, isSubmitting, resetForm, errors, setFieldValue } = useFormValidation(schema, {
  user_id: null,
  national_id: '',
  first_name: '',
  last_name: '',
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

onMounted(async () => {
  try {
    const [posRes, deptRes, supRes] = await Promise.all([
      api.get('/api/positions'),
      api.get('/api/departments'),
      api.get('/api/hr/employees', { params: { limit: 100 } }),
    ])
    positions.value = posRes.data.positions || []
    departments.value = deptRes.data.departments || []
    supervisors.value = supRes.data.employees || []
  } catch (e) {
    console.error('Failed to load form data', e)
  }

  if (props.employee) {
    const emp = props.employee
    resetForm({
      values: {
        user_id: emp.user_id || null,
        national_id: emp.national_id || '',
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        birth_date: emp.birth_date || '',
        gender: emp.gender || '',
        marital_status: emp.marital_status || '',
        phone: emp.phone || '',
        email: emp.email || '',
        personal_email: emp.personal_email || '',
        position_id: emp.position_id || '',
        department_id: emp.department_id || '',
        employment_type: emp.employment_type || 'permanent',
        contract_start_date: emp.contract_start_date || '',
        contract_end_date: emp.contract_end_date || '',
        supervisor_id: emp.supervisor_id || '',
        bank_account: emp.bank_account || '',
        kra_pin: emp.kra_pin || '',
        nssf_no: emp.nssf_no || '',
        nhif_no: emp.nhif_no || '',
      },
    })
  }
})

const employmentTypeOptions = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'casual', label: 'Casual' },
  { value: 'intern', label: 'Intern' },
  { value: 'seconded', label: 'Seconded' },
]

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const maritalStatusOptions = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
]

const onSubmit = handleSubmit(async (formValues) => {
  saving.value = true
  error.value = ''
  try {
    if (isEditing.value) {
      await api.put(`/api/hr/employees/${props.employee.id}`, formValues)
    } else {
      await api.post('/api/hr/employees', formValues)
    }
    emit('saved')
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save employee'
  } finally {
    saving.value = false
  }
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div v-if="error" class="alert alert-error shadow-lg">
      <span>{{ error }}</span>
    </div>

    <!-- Personal Information -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-lg">Personal Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput name="first_name" label="First Name" type="text" required />
          <BaseInput name="last_name" label="Last Name" type="text" required />
          <BaseInput
            name="national_id"
            label="National ID"
            type="text"
            hint="8-digit Kenyan national ID"
            required
          />
          <BaseInput name="birth_date" label="Date of Birth" type="date" />
          <BaseSelect
            name="gender"
            label="Gender"
            :options="genderOptions"
            placeholder="Select..."
          />
          <BaseSelect
            name="marital_status"
            label="Marital Status"
            :options="maritalStatusOptions"
            placeholder="Select..."
          />
        </div>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-lg">Contact Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput name="phone" label="Phone" type="tel" hint="e.g. 0712345678" />
          <BaseInput name="email" label="Work Email" type="email" />
          <BaseInput name="personal_email" label="Personal Email" type="email" />
        </div>
      </div>
    </div>

    <!-- Employment Details -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-lg">Employment Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseSelect
            name="department_id"
            label="Department"
            :options="departments.map(d => ({ value: d.id, label: d.name }))"
            placeholder="Select..."
          />
          <BaseSelect
            name="position_id"
            label="Position"
            :options="positions.map(p => ({ value: p.id, label: `${p.title} (${p.job_grade})` }))"
            placeholder="Select..."
          />
          <BaseSelect
            name="employment_type"
            label="Employment Type"
            :options="employmentTypeOptions"
            required
          />
          <BaseInput name="contract_start_date" label="Contract Start Date" type="date" required />
          <BaseInput name="contract_end_date" label="Contract End Date" type="date" />
          <BaseSelect
            name="supervisor_id"
            label="Supervisor"
            :options="supervisors.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))"
            placeholder="None"
          />
        </div>
      </div>
    </div>

    <!-- Financial & Statutory -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-lg">Financial & Statutory</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput name="bank_account" label="Bank Account" type="text" />
          <BaseInput name="kra_pin" label="KRA PIN" type="text" />
          <BaseInput name="nssf_no" label="NSSF No." type="text" />
          <BaseInput name="nhif_no" label="NHIF No." type="text" />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        <span v-if="saving" class="loading loading-spinner loading-sm"></span>
        {{ isEditing ? 'Update Employee' : 'Create Employee' }}
      </button>
    </div>
  </form>
</template>
