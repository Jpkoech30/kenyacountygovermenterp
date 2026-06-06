<script setup>
/**
 * NotFoundPage.vue — 404 catch-all page using DaisyUI hero layout.
 *
 * Displays a centered hero section with a large "404" heading and
 * a descriptive message. The navigation button is conditional based
 * on authentication state:
 *   - Authenticated: links to Dashboard
 *   - Not authenticated: links to Public Home
 */
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAuthenticated = authStore.isAuthenticated
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-9xl font-bold text-primary">404</h1>
        <p class="text-2xl font-semibold mt-4">Page Not Found</p>
        <p class="py-6 text-base-content/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <router-link
          :to="isAuthenticated ? { name: 'Dashboard' } : { name: 'PublicHome' }"
          class="btn btn-primary"
        >
          {{ isAuthenticated ? 'Go to Dashboard' : 'Go to Home' }}
        </router-link>
      </div>
    </div>
  </div>
</template>
