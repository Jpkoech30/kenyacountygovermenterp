<script setup>
/**
 * NewsDetailPage — full news article.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContentBySlug } from '../../api/public'
import { ArrowLeft, Calendar, User, Share2 } from '@lucide/vue'

const route = useRoute()
const localeStore = useLocaleStore()
const article = ref(null)
const loading = ref(true)

const translation = computed(() => {
  if (!article.value) return {}
  return article.value.translations?.find(t => t.locale === localeStore.locale)
    || article.value.translations?.[0]
    || {}
})

const featuredImage = computed(() => translation.value.featuredImage || null)

useHead({
  title: computed(() => `${translation.value.title || 'News'} — West Pokot County`),
  meta: computed(() => [
    { name: 'description', content: translation.value.meta_description || translation.value.excerpt || '' },
    { property: 'og:title', content: translation.value.title || '' },
    { property: 'og:description', content: translation.value.meta_description || translation.value.excerpt || '' },
  ]),
})

onMounted(async () => {
  try {
    article.value = await fetchContentBySlug(route.params.slug)
  } catch {
    article.value = null
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

function shareArticle() {
  if (navigator.share) {
    navigator.share({ title: translation.value.title, url: window.location.href })
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <router-link to="/news" class="link link-primary text-sm flex items-center gap-1 mb-6">
      <ArrowLeft class="w-4 h-4" />
      {{ localeStore.locale === 'en' ? 'Back to News' : localeStore.locale === 'sw' ? 'Rudi kwa Habari' : 'Ng\'alek' }}
    </router-link>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <article v-else-if="article" class="card bg-base-100 shadow-sm border border-base-200">
      <figure v-if="featuredImage" class="max-h-96 overflow-hidden">
        <img
          :src="`/storage/media/${featuredImage.storage_path || featuredImage.disk_filename}`"
          :alt="featuredImage.alt_text || translation.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </figure>
      <div class="card-body">
        <h1 class="text-2xl md:text-4xl font-bold">{{ translation.title }}</h1>

        <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/60 mt-2 mb-6">
          <span class="flex items-center gap-1"><Calendar class="w-4 h-4" /> {{ formatDate(article.published_at || article.createdAt) }}</span>
          <span v-if="article.author" class="flex items-center gap-1"><User class="w-4 h-4" /> {{ article.author.first_name }} {{ article.author.last_name }}</span>
          <button class="link link-primary text-xs flex items-center gap-1" @click="shareArticle">
            <Share2 class="w-3 h-3" /> Share
          </button>
        </div>

        <div v-if="translation.body" class="prose max-w-none" v-html="translation.body"></div>
        <p v-else class="text-base-content/70">{{ translation.excerpt }}</p>

        <!-- Categories -->
        <div v-if="article.taxonomies?.filter(t => t.type === 'category').length" class="flex flex-wrap gap-2 mt-6 pt-4 border-t">
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mr-1">
            {{ localeStore.locale === 'en' ? 'Categories' : localeStore.locale === 'sw' ? 'Kategoria' : 'Ng\'alek' }}:
          </span>
          <span
            v-for="cat in article.taxonomies.filter(t => t.type === 'category')"
            :key="cat.id"
            class="badge badge-primary badge-sm"
          >
            {{ cat.name }}
          </span>
        </div>

        <!-- Tags -->
        <div v-if="article.taxonomies?.filter(t => t.type === 'tag').length" class="flex flex-wrap gap-2 mt-2">
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mr-1">
            {{ localeStore.locale === 'en' ? 'Tags' : localeStore.locale === 'sw' ? 'Vitambulisho' : 'Ng\'alek' }}:
          </span>
          <span
            v-for="tag in article.taxonomies.filter(t => t.type === 'tag')"
            :key="tag.id"
            class="badge badge-ghost badge-sm"
          >
            {{ tag.name }}
          </span>
        </div>
      </div>
    </article>

    <div v-else class="text-center py-12 text-base-content/60">
      {{ localeStore.locale === 'en' ? 'Article not found.' : localeStore.locale === 'sw' ? 'Makala haikupatikana.' : 'Ng\'alek.' }}
    </div>
  </div>
</template>
