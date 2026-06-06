/**
 * Locale Store — manages the current language (en/sw/pok).
 * Persisted to localStorage.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'wp_public_locale'

export const useLocaleStore = defineStore('locale', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const locale = ref(saved || 'en')

  function setLocale(localeCode) {
    locale.value = localeCode
    localStorage.setItem(STORAGE_KEY, localeCode)
  }

  const isRtl = computed(() => false) // none of our locales are RTL

  return {
    locale,
    setLocale,
    isRtl,
  }
})
