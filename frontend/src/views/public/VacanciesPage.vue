<script setup>
/**
 * VacanciesPage — open vacancies table.
 */
import { ref, onMounted, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchVacancies } from '../../api/public'
import VacancyTable from '../../components/public/VacancyTable.vue'

const localeStore = useLocaleStore()
const vacancies = ref([])
const loading = ref(true)

useHead({
  title: 'Vacancies — West Pokot County',
  meta: [{ name: 'description', content: 'View current job vacancies and career opportunities at West Pokot County Government.' }],
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchVacancies({ limit: 50 })
    vacancies.value = res.vacancies || []
  } catch {
    vacancies.value = []
  }
  loading.value = false
}

onMounted(loadData)
watch(() => localeStore.locale, loadData)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'Job Vacancies' : localeStore.locale === 'sw' ? 'Nafasi za Kazi' : 'Ng\'alekta' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'View current job vacancies and career opportunities.' : localeStore.locale === 'sw' ? 'Angalia nafasi za kazi na fursa za ajira.' : 'Ng\'alekta.' }}
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <VacancyTable v-else :vacancies="vacancies" />
  </div>
</template>
