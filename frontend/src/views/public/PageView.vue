<script setup>
/**
 * PageView — Public page view for displaying published content by slug.
 * Used for dynamic menu links that point to pages.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import { fetchContentBySlug } from '@/api/public'
import { Calendar, User } from '@lucide/vue'

const route = useRoute()
const localeStore = useLocaleStore()

const page = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  await loadPage()
})

async function loadPage() {
  loading.value = true
  error.value = null
  try {
    const slug = route.params.slug
    page.value = await fetchContentBySlug(slug)
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Page not found'
    } else {
      error.value = 'Failed to load page'
    }
  } finally {
    loading.value = false
  }
}

// Get localized content
const translation = computed(() => {
  if (!page.value) return null
  const translations = page.value.translations || []
  const locale = localeStore.locale
  // Try exact locale match first, then fall back to 'en'
  return translations.find((t) => t.locale === locale) ||
         translations.find((t) => t.locale === 'en') ||
         translations[0] ||
         null
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeStore.locale === 'sw' ? 'sw-KE' : 'en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="container mx-auto px-4 py-20 text-center">
      <h1 class="text-3xl font-bold text-base-content/60 mb-4">{{ error }}</h1>
      <router-link to="/" class="btn btn-primary">Go Home</router-link>
    </div>

    <!-- Page content -->
    <article v-else-if="page" class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">
          {{ translation?.title || page.title || 'Untitled' }}
        </h1>

        <!-- Meta -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
          <div v-if="page.author" class="flex items-center gap-1.5">
            <User class="w-4 h-4" />
            <span>{{ page.author.first_name }} {{ page.author.last_name }}</span>
          </div>
          <div v-if="page.published_at" class="flex items-center gap-1.5">
            <Calendar class="w-4 h-4" />
            <span>{{ formatDate(page.published_at) }}</span>
          </div>
          <div v-if="page.type" class="badge badge-outline">{{ page.type }}</div>
        </div>
      </div>

      <!-- Featured image -->
      <div v-if="translation?.featured_image?.url" class="mb-8 rounded-xl overflow-hidden">
        <img
          :src="translation.featured_image.url"
          :alt="translation.featured_image.alt_text || translation?.title || ''"
          class="w-full h-auto max-h-96 object-cover"
        />
      </div>

      <!-- Body content -->
      <div class="prose prose-lg max-w-none bg-base-100 rounded-xl p-8 shadow-sm">
        <!-- Excerpt -->
        <p v-if="translation?.excerpt" class="lead text-lg text-base-content/80 font-medium mb-6">
          {{ translation.excerpt }}
        </p>

        <!-- Main body -->
        <div v-if="translation?.body" v-html="translation.body" class="content-body"></div>
        <div v-else-if="page.body" v-html="page.body" class="content-body"></div>
        <p v-else class="text-base-content/40 italic">No content available.</p>
      </div>

      <!-- Categories -->
      <div v-if="page.categories && page.categories.length > 0" class="mt-6 flex flex-wrap gap-2">
        <span class="text-sm font-medium text-base-content/60">Categories:</span>
        <router-link
          v-for="cat in page.categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="badge badge-outline badge-sm hover:badge-primary transition-colors"
        >
          {{ cat.name }}
        </router-link>
      </div>
    </article>
  </div>
</template>

<style scoped>
.content-body :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.8;
}

.content-body :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.content-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.content-body :deep(li) {
  margin-bottom: 0.25rem;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}

.content-body :deep(blockquote) {
  border-left: 4px solid oklch(var(--p));
  padding-left: 1rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: oklch(var(--bc) / 0.7);
}

.content-body :deep(a) {
  color: oklch(var(--p));
  text-decoration: underline;
}

.content-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.content-body :deep(th),
.content-body :deep(td) {
  border: 1px solid oklch(var(--bc) / 0.2);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.content-body :deep(th) {
  background: oklch(var(--b2));
  font-weight: 600;
}
</style>
