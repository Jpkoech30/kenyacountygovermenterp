<script setup>
/**
 * NewsListPage — paginated news list with category filter.
 */
import { ref, onMounted, watch, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContent, fetchCategories } from '../../api/public'
import NewsCard from '../../components/public/NewsCard.vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const localeStore = useLocaleStore()
const news = ref([])
const categories = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const selectedCategory = ref('')
const limit = 10

useHead({
  title: 'News — West Pokot County',
  meta: [{ name: 'description', content: 'Latest news and updates from West Pokot County Government.' }],
})

async function loadData() {
  loading.value = true
  try {
    const params = { type: 'news', limit, page: page.value, locale: localeStore.locale }
    if (selectedCategory.value) params.category = selectedCategory.value
    const res = await fetchContent(params)
    news.value = res.content || []
    totalPages.value = res.pagination?.totalPages || 1
  } catch {
    news.value = []
  }
  loading.value = false
}

async function loadCategories() {
  try {
    const cats = await fetchCategories()
    categories.value = cats || []
  } catch {
    categories.value = []
  }
}

onMounted(() => {
  loadCategories()
  loadData()
})

watch([() => localeStore.locale, selectedCategory], () => {
  page.value = 1
  loadData()
})

function prevPage() {
  if (page.value > 1) { page.value--; loadData() }
}
function nextPage() {
  if (page.value < totalPages.value) { page.value++; loadData() }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'News & Updates' : localeStore.locale === 'sw' ? 'Habari na Taarifa' : 'Ng\'alek' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'Latest news and updates from West Pokot County Government.' : localeStore.locale === 'sw' ? 'Habari mpya na taarifa kutoka Serikali ya Kaunti ya West Pokot.' : 'Ng\'alek.' }}
    </p>

    <!-- Category filter -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        class="btn btn-sm"
        :class="selectedCategory === '' ? 'btn-primary' : 'btn-ghost'"
        @click="selectedCategory = ''"
      >
        {{ localeStore.locale === 'en' ? 'All' : localeStore.locale === 'sw' ? 'Zote' : 'Ng\'alekta' }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="btn btn-sm"
        :class="selectedCategory === cat.slug ? 'btn-primary' : 'btn-ghost'"
        @click="selectedCategory = cat.slug"
      >
        {{ cat.name }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NewsCard v-for="item in news" :key="item.id" :content="item" />
      <p v-if="news.length === 0" class="col-span-full text-center text-base-content/60 py-12">
        {{ localeStore.locale === 'en' ? 'No news articles found.' : localeStore.locale === 'sw' ? 'Hakuna habari zilizopatikana.' : 'Ng\'alek.' }}
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-4 mt-8">
      <button class="btn btn-sm btn-outline" :disabled="page <= 1" @click="prevPage">
        <ChevronLeft class="w-4 h-4" />
      </button>
      <span class="text-sm text-base-content/60">Page {{ page }} of {{ totalPages }}</span>
      <button class="btn btn-sm btn-outline" :disabled="page >= totalPages" @click="nextPage">
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
