<script setup>
/**
 * AIActionModal.vue - Reusable modal for displaying AI action results.
 * Shows loading state, result preview, cost estimate, and accept/cancel buttons.
 */
import { ref, watch } from 'vue'

const props = defineProps({
  /** Whether the modal is visible */
  visible: { type: Boolean, default: false },
  /** Title of the AI action (e.g., "Grammar Check", "Translate") */
  title: { type: String, default: 'AI Action' },
  /** Loading state while AI processes */
  loading: { type: Boolean, default: false },
  /** The result object from the AI API */
  result: { type: Object, default: null },
  /** Error message if the action failed */
  error: { type: String, default: '' },
  /** Cost estimate in KES */
  costKes: { type: Number, default: 0 },
  /** Whether to show the Accept button */
  showAccept: { type: Boolean, default: true },
  /** Label for the accept button */
  acceptLabel: { type: String, default: 'Apply Changes' },
})

const emit = defineEmits(['close', 'accept', 'cancel'])

function handleAccept() {
  emit('accept', props.result)
}

function handleCancel() {
  emit('cancel')
}

function handleBackdropClick() {
  if (!props.loading) {
    emit('close')
  }
}
</script>

<template>
  <dialog
    :open="visible"
    class="modal"
    :class="{ 'modal-open': visible }"
    @click.self="handleBackdropClick"
  >
    <div class="modal-box max-w-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <span class="text-lg">🤖</span>
          {{ title }}
        </h3>
        <button
          class="btn btn-sm btn-ghost btn-square"
          :disabled="loading"
          @click="handleCancel"
        >
          ✕
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center py-8">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="mt-4 text-base-content/60">AI is processing your request...</p>
        <p class="text-sm text-base-content/40">This may take a few seconds.</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-error mb-4">
        <span>⚠️ {{ error }}</span>
      </div>

      <!-- Result content (slot for custom rendering) -->
      <div v-else-if="result" class="space-y-4">
        <div class="bg-base-200 rounded-lg p-4 max-h-80 overflow-y-auto">
          <slot name="result" :result="result">
            <pre class="text-sm whitespace-pre-wrap">{{ JSON.stringify(result, null, 2) }}</pre>
          </slot>
        </div>

        <!-- Cost estimate -->
        <div
          v-if="costKes > 0"
          class="flex items-center gap-2 text-sm text-base-content/60 bg-base-200 rounded-lg px-4 py-2"
        >
          <span>💰</span>
          <span>Estimated cost: <strong>KES {{ costKes.toFixed(2) }}</strong></span>
        </div>
      </div>

      <!-- Empty state (no result yet, not loading) -->
      <div v-else class="text-center py-8 text-base-content/40">
        <p>No result yet. Submit an AI action to see results here.</p>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button class="btn btn-ghost" :disabled="loading" @click="handleCancel">
          {{ loading ? 'Processing...' : 'Cancel' }}
        </button>
        <button
          v-if="showAccept && result && !loading && !error"
          class="btn btn-primary"
          @click="handleAccept"
        >
          {{ acceptLabel }}
        </button>
      </div>
    </div>

    <!-- Backdrop -->
    <form method="dialog" class="modal-backdrop">
      <button @click="handleCancel" :disabled="loading">close</button>
    </form>
  </dialog>
</template>
