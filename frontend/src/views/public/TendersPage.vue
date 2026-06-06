<script setup>
/**
 * TendersPage — open tenders table.
 */
import { ref, onMounted, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchTenders } from '../../api/public'
import TenderTable from '../../components/public/TenderTable.vue'

const localeStore = useLocaleStore()
const tenders = ref([])
const loading = ref(true)

useHead({
  title: 'Tenders — West Pokot County',
  meta: [{ name: 'description', content: 'View open tenders and procurement opportunities from West Pokot County Government.' }],
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchTenders({ limit: 50 })
    tenders.value = res.tenders || []
  } catch {
    tenders.value = []
  }
  loading.value = false
}

onMounted(loadData)
watch(() => localeStore.locale, loadData)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'Open Tenders' : localeStore.locale === 'sw' ? 'Zabuni Wazi' : 'Zabuni' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'View open tenders and procurement opportunities.' : localeStore.locale === 'sw' ? 'Angalia zabuni wazi na fursa za ununuzi.' : 'Ng\'alekta.' }}
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <TenderTable v-else :tenders="tenders" />
  </div>
</template>
