<script setup>
/**
 * ToastContainer — renders all active toasts from the shared useToast composable.
 * Place once in a layout to enable global toast notifications.
 */
import { useToast } from '../composables/useToast'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from '@lucide/vue'

const { toasts } = useToast()

function removeToast(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}
</script>

<template>
  <div class="toast toast-top toast-end z-50">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="alert shadow-lg flex items-center gap-2"
      :class="{
        'alert-success': toast.type === 'success',
        'alert-error': toast.type === 'error',
        'alert-warning': toast.type === 'warning',
        'alert-info': toast.type === 'info',
      }"
    >
      <component :is="iconMap[toast.type] || Info" class="w-5 h-5 shrink-0" />
      <span class="text-sm">{{ toast.message }}</span>
      <button class="btn btn-ghost btn-xs ml-auto" @click="removeToast(toast.id)">
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
