<script setup>
/**
 * FactRotator — cycles through county facts every 10 seconds.
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { fetchFacts } from '../../api/public'
import { useLocaleStore } from '../../stores/locale'

const localeStore = useLocaleStore()
const facts = ref([])
const current = ref(0)
let interval = null

onMounted(async () => {
  try {
    facts.value = await fetchFacts()
  } catch {
    // silently fail
  }
  interval = setInterval(() => {
    if (facts.value.length > 0) {
      current.value = (current.value + 1) % facts.value.length
    }
  }, 10000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const currentFact = computed(() => {
  if (facts.value.length === 0) return null
  const fact = facts.value[current.value]
  const key = `text_${localeStore.locale}`
  return fact[key] || fact.text_en
})
</script>

<template>
  <div v-if="facts.length > 0" class="bg-primary text-primary-content rounded-xl p-6 text-center shadow-md">
    <p class="text-lg md:text-xl font-medium italic leading-relaxed transition-opacity duration-500">
      "{{ currentFact }}"
    </p>
    <div class="flex justify-center gap-1.5 mt-4">
      <span
        v-for="(_, idx) in facts"
        :key="idx"
        class="w-2 h-2 rounded-full transition-colors"
        :class="idx === current ? 'bg-primary-content' : 'bg-primary-content/30'"
      />
    </div>
  </div>
</template>
