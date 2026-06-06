/**
 * useRouteGuard.js — Global unsaved-changes guard composable.
 *
 * Provides a shared `pendingNavigation` ref that any component can use
 * to block navigation with a custom modal dialog (e.g., ConfirmDialog).
 *
 * The `pendingNavigation` ref is module-scoped (singleton), so all
 * components share the same instance. When a route guard detects unsaved
 * changes, it sets `pendingNavigation` to an object with a `resolve`
 * callback. The ConfirmDialog component can then call `confirmNavigation()`
 * or `cancelNavigation()` to resolve or reject the pending navigation.
 *
 * Usage:
 *   const { pendingNavigation, confirmNavigation, cancelNavigation } = useRouteGuard()
 *
 *   // Block navigation:
 *   pendingNavigation.value = {
 *     resolve: null,  // Will be set internally
 *     reject: null,   // Will be set internally
 *   }
 *
 *   // After user confirms:
 *   confirmNavigation()
 *
 *   // After user cancels:
 *   cancelNavigation()
 */
import { ref } from 'vue'

/** @type {import('vue').Ref<{ resolve: (value: boolean) => void, reject: (value: boolean) => void } | null>} */
const pendingNavigation = ref(null)

export function useRouteGuard() {
  /**
   * Confirm the pending navigation — resolves with `true`.
   */
  function confirmNavigation() {
    if (pendingNavigation.value?.resolve) {
      pendingNavigation.value.resolve(true)
    }
    pendingNavigation.value = null
  }

  /**
   * Cancel the pending navigation — resolves with `false`.
   */
  function cancelNavigation() {
    if (pendingNavigation.value?.reject) {
      pendingNavigation.value.reject(false)
    }
    pendingNavigation.value = null
  }

  return {
    pendingNavigation,
    confirmNavigation,
    cancelNavigation,
  }
}
