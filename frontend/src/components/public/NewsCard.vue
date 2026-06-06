<script setup>
/**
 * NewsCard — displays a news article card.
 */
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { Calendar, ArrowRight } from '@lucide/vue'

const props = defineProps({
  content: { type: Object, required: true },
})

const localeStore = useLocaleStore()

const translation = computed(() => {
  return props.content.translations?.find(t => t.locale === localeStore.locale)
    || props.content.translations?.[0]
    || {}
})

const featuredImage = computed(() => {
  return translation.value.featuredImage || null
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeStore.locale === 'en' ? 'en-US' : localeStore.locale === 'sw' ? 'sw-KE' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
    <figure v-if="featuredImage" class="h-40 overflow-hidden">
      <img
        :src="`/storage/media/${featuredImage.storage_path || featuredImage.disk_filename}`"
        :alt="featuredImage.alt_text || translation.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </figure>
    <div class="card-body p-4">
      <div class="flex items-center gap-2 text-xs text-base-content/60 mb-1">
        <Calendar class="w-3 h-3" />
        <span>{{ formatDate(content.published_at || content.createdAt) }}</span>
      </div>
      <div v-if="content.taxonomies?.filter(t => t.type === 'category').length" class="flex flex-wrap gap-1 mb-1">
        <span
          v-for="cat in content.taxonomies.filter(t => t.type === 'category').slice(0, 2)"
          :key="cat.id"
          class="badge badge-primary badge-xs"
        >
          {{ cat.name }}
        </span>
      </div>
      <h3 class="card-title text-base line-clamp-2">{{ translation.title }}</h3>
      <p v-if="translation.excerpt" class="text-sm text-base-content/70 line-clamp-3">{{ translation.excerpt }}</p>
      <div class="card-actions mt-2">
        <router-link :to="`/news/${content.slug}`" class="link link-primary text-sm flex items-center gap-1">
          Read More <ArrowRight class="w-3 h-3" />
        </router-link>
      </div>
    </div>
  </div>
</template>
