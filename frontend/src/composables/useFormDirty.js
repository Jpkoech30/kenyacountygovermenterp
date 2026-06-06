/**
 * useFormDirty.js – Composable for form dirty-state tracking and unsaved-changes guard.
 *
 * Features:
 * - Tracks whether a form has been modified from its initial state
 * - Provides a `registerBeforeLeave` function that accepts a custom async handler
 *   returning `true` (allow navigation) or `false` (block navigation)
 * - Exposes `markClean()` to reset dirty state after save
 * - Exposes `markDirty()` to force dirty state
 *
 * Usage:
 *   const { isDirty, markClean, markDirty, originalSnapshot, setOriginalSnapshot, registerBeforeLeave } = useFormDirty()
 *
 *   // After loading data:
 *   setOriginalSnapshot(form.value)
 *
 *   // In template:
 *   <button :disabled="saving || !isDirty">Save</button>
 *
 *   // After save:
 *   markClean()
 *
 *   // Register a custom before-leave handler (e.g., using ConfirmDialog):
 *   registerBeforeLeave(async (to, from) => {
 *     if (isDirty.value) {
 *       const confirmed = await dialog.value.showDialog({
 *         title: 'Unsaved Changes',
 *         message: 'You have unsaved changes. Are you sure you want to leave?',
 *         confirmLabel: 'Leave',
 *         cancelLabel: 'Stay',
 *       })
 *       return confirmed
 *     }
 *     return true
 *   })
 */
import { ref, computed } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Deep-compares two values for dirty checking.
 * Handles primitives, arrays, and plain objects.
 */
function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return a === b

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => deepEqual(a[key], b[key]))
}

/**
 * Creates a stable snapshot of a value for comparison.
 * Strips Vue reactivity by spreading plain objects/arrays.
 */
function createSnapshot(value) {
  if (value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(createSnapshot)
  // Plain object
  const snapshot = {}
  for (const key of Object.keys(value)) {
    snapshot[key] = createSnapshot(value[key])
  }
  return snapshot
}

export function useFormDirty() {
  const originalSnapshot = ref(null)
  const currentSnapshot = ref(null)
  const forceDirty = ref(false)

  const isDirty = computed(() => {
    if (forceDirty.value) return true
    if (originalSnapshot.value === null) return false
    return !deepEqual(originalSnapshot.value, currentSnapshot.value)
  })

  /**
   * Set the original snapshot from current form values.
   * Call this after loading data or after save.
   * @param {object} formValues - Current form values to snapshot
   */
  function setOriginalSnapshot(formValues) {
    originalSnapshot.value = createSnapshot(formValues)
    currentSnapshot.value = createSnapshot(formValues)
    forceDirty.value = false
  }

  /**
   * Update the current snapshot for comparison.
   * Call this whenever form values change.
   * @param {object} formValues - Current form values
   */
  function updateSnapshot(formValues) {
    currentSnapshot.value = createSnapshot(formValues)
  }

  /**
   * Mark form as clean (after successful save).
   */
  function markClean() {
    if (originalSnapshot.value !== null) {
      currentSnapshot.value = { ...originalSnapshot.value }
    }
    forceDirty.value = false
  }

  /**
   * Force form to be dirty (e.g., after programmatic changes).
   */
  function markDirty() {
    forceDirty.value = true
  }

  /**
   * Register a custom before-route-leave handler.
   *
   * Unlike the previous `registerLeaveGuard` which used `window.confirm()`,
   * this accepts an async callback that receives `(to, from)` and should
   * return `true` to allow navigation or `false` to block it.
   *
   * This enables integration with custom modals like ConfirmDialog.
   *
   * @param {(to: RouteLocationNormalized, from: RouteLocationNormalized) => Promise<boolean>} handler
   *   Async function that returns true to allow navigation, false to block.
   */
  function registerBeforeLeave(handler) {
    onBeforeRouteLeave(async (to, from, next) => {
      if (!handler) {
        next()
        return
      }

      try {
        const result = await handler(to, from)
        if (result) {
          next()
        } else {
          next(false)
        }
      } catch {
        // If handler throws, allow navigation by default
        next()
      }
    })
  }

  return {
    isDirty,
    markClean,
    markDirty,
    setOriginalSnapshot,
    updateSnapshot,
    registerBeforeLeave,
  }
}
