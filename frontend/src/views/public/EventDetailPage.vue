<script setup>
/**
 * EventDetailPage — single event detail.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContentBySlug } from '../../api/public'
import { ArrowLeft, Calendar, MapPin, Clock } from '@lucide/vue'

const route = useRoute()
const localeStore = useLocaleStore()
const event = ref(null)
const loading = ref(true)

const translation = computed(() => {
  if (!event.value) return {}
  return event.value.translations?.find(t => t.locale === localeStore.locale)
    || event.value.translations?.[0]
    || {}
})

useHead({
  title: computed(() => `${translation.value.title || 'Event'} — West Pokot County`),
})

onMounted(async () => {
  try {
    event.value = await fetchContentBySlug(route.params.slug)
  } catch {
    event.value = null
  }
  loading.value = false
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : localeStore.locale === 'sw' ? 'sw-KE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getMeta(key) {
  return event.value?.meta?.find(m => m.meta_key === key)?.meta_value || ''
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <router-link to="/events" class="link link-primary text-sm flex items-center gap-1 mb-6">
      <ArrowLeft class="w-4 h-4" />
      {{ localeStore.locale === 'en' ? 'Back to Events' : localeStore.locale === 'sw' ? 'Rudi kwa Matukio' : 'Ng\'alekta' }}
    </router-link>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="event" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h1 class="text-2xl md:text-3xl font-bold">{{ translation.title }}</h1>

        <div class="flex flex-wrap gap-4 mt-4 text-sm text-base-content/70">
          <span v-if="getMeta('event_start_date')" class="flex items-center gap-1">
            <Calendar class="w-4 h-4 text-primary" /> {{ formatDate(getMeta('event_start_date')) }}
          </span>
          <span v-if="getMeta('event_end_date')" class="flex items-center gap-1">
            <Clock class="w-4 h-4 text-primary" /> {{ localeStore.locale === 'en' ? 'to' : localeStore.locale === 'sw' ? 'hadi' : 'Ng\'alek' }} {{ formatDate(getMeta('event_end_date')) }}
          </span>
          <span v-if="getMeta('event_location')" class="flex items-center gap-1">
            <MapPin class="w-4 h-4 text-primary" /> {{ getMeta('event_location') }}
          </span>
        </div>

        <div v-if="translation.body" class="prose max-w-none mt-6" v-html="translation.body"></div>
        <p v-else-if="translation.excerpt" class="mt-6 text-base-content/70">{{ translation.excerpt }}</p>
      </div>
    </div>

    <div v-else class="text-center py-12 text-base-content/60">
      {{ localeStore.locale === 'en' ? 'Event not found.' : localeStore.locale === 'sw' ? 'Tukio halikupatikana.' : 'Ng\'alek.' }}
    </div>
  </div>
</template>
