<script setup>
/**
 * User Form Page (Admin only)
 * Used for both Add and Edit user operations.
 * Refactored to use vee-validate + Yup + BaseInput/BaseSelect components.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/users'
import apiClient from '../../api/axios'
import { useToast } from '../../composables/useToast'
import * as yup from 'yup'
import { useFormValidation } from '../../composables/useFormValidation'
import { useFormDirty } from '../../composables/useFormDirty'
import BaseInput from '../../components/forms/BaseInput.vue'
import BaseSelect from '../../components/forms/BaseSelect.vue'

const props = defineProps({
  id: { type: String, default: null },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isEdit = computed(() => !!route.params.id || !!props.id)
const userId = computed(() => route.params.id || props.id)

// Yup validation schema
const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  first_name: yup.string().trim().required('First name is required'),
  last_name: yup.string().trim().required('Last name is required'),
  department_id: yup.string(),
  role_id: yup.string().required('Role is required'),
  is_active: yup.boolean(),
  send_email: yup.boolean(),
})

const { handleSubmit, isSubmitting, resetForm, errors, values, setFieldValue } = useFormValidation(schema, {
  email: '',
  first_name: '',
  last_name: '',
  department_id: '',
  role_id: '',
  is_active: true,
  send_email: true,
})

// Dirty-state tracking for unsaved-changes guard
const { isDirty, markClean, setOriginalSnapshot, updateSnapshot, registerBeforeLeave } = useFormDirty()

// Register unsaved-changes guard (only for edit mode)
registerBeforeLeave(() => isEdit.value ? isDirty.value : false)

const loading = ref(false)
const errorMessage = ref('')

// Dropdown options
const departments = ref([])
const roles = ref([])

// Toast notifications
const { addToast } = useToast()

// Load dropdown options from API
async function loadFormOptions() {
  try {
    const [deptRes, rolesRes] = await Promise.all([
      apiClient.get('/departments'),
      apiClient.get('/roles'),
    ])
    departments.value = deptRes.data
    roles.value = rolesRes.data
  } catch (err) {
    console.error('Failed to load form options:', err)
    // Fallback to hardcoded data if API is unavailable
    departments.value = [
      { id: 1, name: 'Health', code: 'HLT' },
      { id: 2, name: 'Trade', code: 'TRD' },
      { id: 3, name: 'Agriculture', code: 'AGR' },
      { id: 4, name: 'ICT', code: 'ICT' },
      { id: 5, name: 'Finance', code: 'FIN' },
    ]
    roles.value = [
      { id: 1, name: 'admin' },
      { id: 2, name: 'editor' },
      { id: 3, name: 'revenue_officer' },
      { id: 4, name: 'revenue_clerk' },
      { id: 5, name: 'cyber_provider' },
      { id: 6, name: 'hr_officer' },
      { id: 7, name: 'supervisor' },
      { id: 8, name: 'employee' },
      { id: 9, name: 'health_officer' },
      { id: 10, name: 'health_worker' },
    ]
  }
}

// Load user data for editing
async function loadUser() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const response = await apiClient.get(`/users/${userId.value}`)
    const user = response.data
    resetForm({
      values: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        department_id: user.department_id || '',
        role_id: user.role_id,
        is_active: user.is_active,
        send_email: false,
      },
    })
    // Set initial snapshot for dirty tracking after form is populated
    setOriginalSnapshot(values.value)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to load user data.'
    addToast(errorMessage.value, 'error')
  } finally {
    loading.value = false
  }
}

// Watch form values for dirty tracking
watch(
  () => values.value,
  (newVal) => {
    if (!loading.value) {
      updateSnapshot(newVal)
    }
  },
  { deep: true }
)

// Submit form – wrapped with vee-validate handleSubmit
const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = ''

  try {
    const payload = {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      department_id: values.department_id || null,
      role_id: values.role_id,
    }

    if (isEdit.value) {
      payload.is_active = values.is_active
      await userStore.updateUser(userId.value, payload)
      addToast('User updated successfully')
      markClean()
    } else {
      payload.send_email = values.send_email
      await userStore.createUser(payload)
      addToast('User created successfully')
    }

    // Redirect back to user list after short delay
    setTimeout(() => {
      router.push('/admin/users')
    }, 1500)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to save user.'
    addToast(errorMessage.value, 'error')
  }
})

onMounted(() => {
  loadFormOptions()
  if (isEdit.value) {
    loadUser()
  }
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit User' : 'Add New User' }}</h1>
      <p class="text-base-content/60 text-sm">
        {{ isEdit ? 'Update user details and permissions' : 'Create a new system user' }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Form -->
    <div v-else class="card bg-base-100 shadow-sm max-w-2xl">
      <div class="card-body">
        <!-- Error message -->
        <div v-if="errorMessage" class="alert alert-error mb-4">
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="onSubmit">
          <!-- Email -->
          <BaseInput
            name="email"
            label="Email"
            type="email"
            placeholder="user@westpokot.go.ke"
            required
          />

          <!-- First Name -->
          <BaseInput
            name="first_name"
            label="First Name"
            type="text"
            placeholder="John"
            required
          />

          <!-- Last Name -->
          <BaseInput
            name="last_name"
            label="Last Name"
            type="text"
            placeholder="Doe"
            required
          />

          <!-- Department -->
          <BaseSelect
            name="department_id"
            label="Department"
            :options="departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))"
            placeholder="Select Department"
          />

          <!-- Role -->
          <BaseSelect
            name="role_id"
            label="Role"
            :options="roles.map(r => ({ value: r.id, label: r.name.replace('_', ' ') }))"
            placeholder="Select Role"
            required
          />

          <!-- Active toggle (edit only) -->
          <div v-if="isEdit" class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                :checked="true"
                class="toggle toggle-primary"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span class="label-text">Account Active</span>
            </label>
          </div>

          <!-- Send welcome email (add only) -->
          <div v-if="!isEdit" class="form-control mb-6">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                :checked="true"
                class="checkbox checkbox-primary"
                @change="setFieldValue('send_email', $event.target.checked)"
              />
              <span class="label-text">Send welcome email with password reset link</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="submit"
              class="btn btn-primary"
              :class="{ loading: isSubmitting }"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User' }}
            </button>
            <router-link to="/admin/users" class="btn btn-ghost">Cancel</router-link>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
