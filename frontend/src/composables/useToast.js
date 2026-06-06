/**
 * useToast — shared composable for global toast notifications.
 * Module-level state ensures all consumers share the same reactive array.
 */
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, addToast }
}
