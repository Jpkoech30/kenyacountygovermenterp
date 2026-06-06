<script setup>
/**
 * Login Page
 * Public page with email/password form.
 * Refactored to use vee-validate + Yup + BaseInput.
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import * as yup from 'yup'
import { useFormValidation } from '../composables/useFormValidation'
import { useToast } from '../composables/useToast'
import BaseInput from '../components/forms/BaseInput.vue'

const { addToast } = useToast()

const authStore = useAuthStore()
const router = useRouter()

const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const { handleSubmit, isSubmitting } = useFormValidation(schema, {
  email: '',
  password: '',
})

const onSubmit = handleSubmit(async (values) => {
  const result = await authStore.login(values.email, values.password)

  if (result.success) {
    addToast('Login successful! Welcome back.', 'success')
    router.push({ name: 'Dashboard' })
  } else {
    addToast(result.message || 'Login failed. Please check your credentials.', 'error')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body p-8">
        <!-- Logo / Header -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🏛️</div>
          <h1 class="text-2xl font-bold">West Pokot County</h1>
          <p class="text-base-content/60 text-sm">ERP System Login</p>
        </div>

        <!-- Login form -->
        <form @submit.prevent="onSubmit">
          <BaseInput
            name="email"
            label="Email"
            type="email"
            placeholder="admin@westpokot.go.ke"
            required
          />

          <BaseInput
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />

          <div class="mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :class="{ loading: isSubmitting }"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
