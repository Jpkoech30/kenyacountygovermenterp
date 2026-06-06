<script setup>
/**
 * ConfirmDialog.vue — Reusable confirmation modal using DaisyUI dialog.
 * Provides a Promise-based API for confirm/cancel flows.
 *
 * Usage:
 *   const dialog = ref(null)
 *   const confirmed = await dialog.value.showDialog({
 *     title: 'Delete Item',
 *     message: 'Are you sure? This cannot be undone.',
 *     variant: 'danger',
 *     confirmLabel: 'Delete',
 *     cancelLabel: 'Cancel',
 *   })
 *   if (confirmed) { /* proceed with action * / }
 */
import { ref } from 'vue'
import { AlertTriangle, Trash2 } from '@lucide/vue'

const show = ref(false)
let resolvePromise = null

const config = ref({
  title: 'Confirm',
  message: 'Are you sure?',
  variant: 'default',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

function showDialog(opts = {}) {
  config.value = { ...config.value, ...opts }
  show.value = true
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function handleConfirm() {
  show.value = false
  resolvePromise?.(true)
  resolvePromise = null
}

function handleCancel() {
  show.value = false
  resolvePromise?.(false)
  resolvePromise = null
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') handleCancel()
  if (e.key === 'Enter' && !e.shiftKey) handleConfirm()
}

defineExpose({ showDialog })
</script>

<template>
  <Teleport to="body">
    <dialog
      :open="show"
      class="modal modal-bottom sm:modal-middle"
      @click="handleBackdropClick"
      @keydown="handleKeydown"
    >
      <div class="modal-box">
        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <div
            class="p-3 rounded-full"
            :class="config.variant === 'danger' ? 'bg-error/10' : 'bg-info/10'"
          >
            <AlertTriangle
              v-if="config.variant === 'danger'"
              class="w-8 h-8 text-error"
            />
            <AlertTriangle
              v-else
              class="w-8 h-8 text-info"
            />
          </div>
        </div>

        <!-- Title -->
        <h3 class="font-bold text-lg text-center mb-2">{{ config.title }}</h3>

        <!-- Message -->
        <p class="text-sm text-base-content/70 text-center mb-6">{{ config.message }}</p>

        <!-- Default slot for extra content (e.g., input fields) -->
        <slot />

        <!-- Actions -->
        <div class="flex justify-center gap-3 mt-4">
          <button class="btn btn-ghost" @click="handleCancel">
            {{ config.cancelLabel }}
          </button>
          <button
            class="btn"
            :class="config.variant === 'danger' ? 'btn-error' : 'btn-primary'"
            @click="handleConfirm"
          >
            <Trash2 v-if="config.variant === 'danger'" class="w-4 h-4 mr-1" />
            {{ config.confirmLabel }}
          </button>
        </div>
      </div>
      <!-- Backdrop -->
      <form method="dialog" class="modal-backdrop">
        <button @click="handleCancel">close</button>
      </form>
    </dialog>
  </Teleport>
</template>
