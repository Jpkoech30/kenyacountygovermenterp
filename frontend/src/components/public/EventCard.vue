<script setup>
/**
 * EventCard — displays an event card.
 */
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { Calendar, MapPin, ArrowRight } from '@lucide/vue'

const props = defineProps({
  content: { type: Object, required: true },
})

const localeStore = useLocaleStore()

const translation = computed(() => {
  return props.content.translations?.find(t => t.locale === localeStore.locale)
    || props.content.translations?.[0]
    || {}
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : localeStore.locale === 'sw' ? 'sw-KE' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getMeta(key) {
  return props.content.meta?.find(m => m.meta_key === key)?.meta_value || ''
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
    <div class="card-body p-4">
      <div class="flex items-start gap-3">
        <!-- Date badge -->
        <div class="flex flex-col items-center bg-primary text-primary-content rounded-lg min-w-[60px] py-2 px-3">
          <span class="text-lg font-bold leading-none">{{ new Date(content.published_at || content.createdAt).getDate() }}</span>
          <span class="text-xs uppercase">{{ new Date(content.published_at || content.createdAt).toLocaleDateString('en', { month: 'short' }) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm line-clamp-2">{{ translation.title }}</h3>
          <div class="flex flex-wrap gap-2 mt-1 text-xs text-base-content/60">
            <span v-if="getMeta('event_location')" class="flex items-center gap-1">
              <MapPin class="w-3 h-3" /> {{ getMeta('event_location') }}
            </span>
            <span v-if="getMeta('event_end_date')" class="flex items-center gap-1">
              <Calendar class="w-3 h-3" /> {{ formatDate(getMeta('event_end_date')) }}
            </span>
          </div>
          <p v-if="translation.excerpt" class="text-xs text-base-content/70 mt-1 line-clamp-2">{{ translation.excerpt }}</p>
          <router-link :to="`/events/${content.slug}`" class="link link-primary text-xs flex items-center gap-1 mt-2">
            Details <ArrowRight class="w-3 h-3" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
