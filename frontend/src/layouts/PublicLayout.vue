<script setup>
/**
 * PublicLayout — wraps all public-facing pages with header, footer, and accessibility toolbar.
 */
import { ref } from 'vue'
import AppHeader from '../components/public/AppHeader.vue'
import AppFooter from '../components/public/AppFooter.vue'
import AccessibilityToolbar from '../components/public/AccessibilityToolbar.vue'
import ToastContainer from '../components/ToastContainer.vue'

const showAccessibility = ref(false)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Skip to content (visually hidden, focusable) -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:btn focus:btn-primary">
      Skip to content
    </a>

    <AppHeader @toggle-accessibility="showAccessibility = !showAccessibility" />

    <main id="main-content" class="flex-1">
      <router-view />
    </main>

    <AppFooter />

    <AccessibilityToolbar v-if="showAccessibility" @close="showAccessibility = false" />

    <!-- Global toast notifications -->
    <ToastContainer />
  </div>
</template>
