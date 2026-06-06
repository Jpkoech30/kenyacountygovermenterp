<script setup>
/**
 * Reset Password Page
 * Public page accessible via email reset link.
 * Validates the token and allows user to set a new password.
 * Uses vee-validate + Yup validation with base form components.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import apiClient from '../api/axios'
import { useFormValidation } from '../composables/useFormValidation'
import BaseInput from '../components/forms/BaseInput.vue'

const route = useRoute()
const router = useRouter()

const token = ref('')
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tokenValid = ref(true)

const schema = yup.object({
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  passwordConfirm: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
})

const { handleSubmit, isSubmitting, resetForm, errors } = useFormValidation(schema, {
  password: '',
  passwordConfirm: '',
})

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    tokenValid.value = false
    errorMessage.value = 'No reset token provided. The link you used may be invalid.'
  }
})

const onSubmit = handleSubmit(async (formValues) => {
  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await apiClient.post('/auth/reset-password', {
      token: token.value,
      password: formValues.password,
    })
    successMessage.value = response.data.message || 'Password reset successfully!'
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 3000)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to reset password. The link may have expired.'
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body p-8">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🔐</div>
          <h1 class="text-2xl font-bold">Reset Password</h1>
          <p class="text-base-content/60 text-sm">Enter your new password</p>
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="alert alert-success mb-4">
          <span>{{ successMessage }}</span>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage && !successMessage" class="alert alert-error mb-4">
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Reset form -->
        <form v-if="!successMessage" @submit.prevent="onSubmit">
          <div class="space-y-4 mb-6">
            <BaseInput
              name="password"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              :disabled="!tokenValid"
            />
            <BaseInput
              name="passwordConfirm"
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              :disabled="!tokenValid"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :class="{ loading: submitting }"
            :disabled="submitting || !tokenValid"
          >
            {{ submitting ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <!-- Link to login -->
        <div class="text-center mt-4">
          <router-link to="/login" class="link link-primary text-sm">
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
