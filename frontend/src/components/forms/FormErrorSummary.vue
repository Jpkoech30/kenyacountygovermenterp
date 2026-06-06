<script setup>
/**
 * FormErrorSummary.vue – Accessible form-level error summary.
 * Displays a list of validation errors with an alert banner.
 * Uses `aria-live="polite"` for screen reader announcements.
 * Auto-focuses on mount when errors are present.
 */
import { ref, watch, nextTick } from 'vue'
import { AlertTriangle } from '@lucide/vue'

const props = defineProps({
  errors: { type: Object, default: () => ({}) },
  /**
   * Optional mapping of field names to human-readable labels.
   * Example: { email: 'Email Address', first_name: 'First Name' }
   */
  fieldLabels: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['focus-field'])

const summaryRef = ref(null)
const visible = ref(false)

// Compute flat list of error messages
const errorList = computed(() => {
  const list = []
  for (const [field, msg] of Object.entries(props.errors)) {
    if (msg) {
      const label = props.fieldLabels[field] || field
      list.push({ field, label, message: Array.isArray(msg) ? msg[0] : msg })
    }
  }
  return list
})

import { computed } from 'vue'

watch(
  () => props.errors,
  async (newErrors) => {
    const hasErrors = Object.values(newErrors).some((e) => e)
    if (hasErrors) {
      visible.value = true
      await nextTick()
      summaryRef.value?.focus()
    } else {
      visible.value = false
    }
  },
  { deep: true }
)

function handleFocusField(field) {
  emit('focus-field', field)
}
</script>

<template>
  <div
    v-if="visible && errorList.length > 0"
    ref="summaryRef"
    class="alert alert-error shadow-sm mb-4"
    role="alert"
    aria-live="polite"
    tabindex="-1"
  >
    <div class="flex items-start gap-2">
      <AlertTriangle class="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p class="font-semibold text-sm">
          Please correct the following {{ errorList.length === 1 ? 'error' : 'errors' }}:
        </p>
        <ul class="list-disc list-inside text-sm mt-1 space-y-0.5">
          <li
            v-for="err in errorList"
            :key="err.field"
          >
            <button
              class="link link-hover text-left"
              @click="handleFocusField(err.field)"
              type="button"
            >
              <span class="font-medium">{{ err.label }}:</span> {{ err.message }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
