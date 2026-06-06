<script setup>
/**
 * EventsPage — grid of upcoming events.
 */
import { ref, onMounted, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchEvents } from '../../api/public'
import EventCard from '../../components/public/EventCard.vue'

const localeStore = useLocaleStore()
const events = ref([])
const loading = ref(true)

useHead({
  title: 'Events — West Pokot County',
  meta: [{ name: 'description', content: 'Upcoming events and activities from West Pokot County Government.' }],
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchEvents({ upcoming: true, limit: 20, locale: localeStore.locale })
    events.value = res.events || []
  } catch {
    events.value = []
  }
  loading.value = false
}

onMounted(loadData)
watch(() => localeStore.locale, loadData)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'Upcoming Events' : localeStore.locale === 'sw' ? 'Matukio Yajayo' : 'Ng\'alekta' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'Upcoming events and activities from West Pokot County Government.' : localeStore.locale === 'sw' ? 'Matukio yajayo na shughuli kutoka Serikali ya Kaunti ya West Pokot.' : 'Ng\'alekta.' }}
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <EventCard v-for="item in events" :key="item.id" :content="item" />
      <p v-if="events.length === 0" class="col-span-full text-center text-base-content/60 py-12">
        {{ localeStore.locale === 'en' ? 'No upcoming events.' : localeStore.locale === 'sw' ? 'Hakuna matukio yajayo.' : 'Ng\'alek.' }}
      </p>
    </div>
  </div>
</template>
