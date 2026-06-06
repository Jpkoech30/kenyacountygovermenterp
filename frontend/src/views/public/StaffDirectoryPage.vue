<script setup>
/**
 * StaffDirectoryPage.vue — Public-facing county staff directory.
 * Shows all staff members with photos, filterable by department.
 */
import { ref, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchPersons, fetchDepartments } from '../../api/public'
import { UserCircle, Building2, Search, X, ChevronDown, ChevronUp, Globe, Mail } from '@lucide/vue'

const localeStore = useLocaleStore()

const persons = ref([])
const departments = ref([])
const loading = ref(true)
const searchQuery = ref('')
const filterDepartment = ref(null)
const expandedId = ref(null)

useHead({
  title: 'County Staff Directory — West Pokot County Government',
  meta: [
    { name: 'description', content: 'Browse the West Pokot County Government staff directory. Find county officials, department heads, and public servants.' },
  ],
})

async function loadData() {
  loading.value = true
  try {
    const [personsRes, deptRes] = await Promise.all([
      fetchPersons(),
      fetchDepartments(),
    ])
    persons.value = personsRes || []
    departments.value = deptRes || []
  } catch {
    // silently fail
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const filteredPersons = computed(() => {
  let result = persons.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    )
  }
  return result
})

function getInitials(name) {
  if (!name || !name.trim()) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function getPhotoUrl(person) {
  if (!person.media) return null
  return `/media/${person.media.disk_filename}`
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function getSocialLinks(person) {
  if (!person.social_links) return []
  try {
    const links = typeof person.social_links === 'string' ? JSON.parse(person.social_links) : person.social_links
    return Object.entries(links).map(([platform, url]) => ({ platform, url }))
  } catch {
    return []
  }
}

function t(label) {
  return label[localeStore.locale] || label.en
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold mb-2">
        {{ t({ en: 'County Staff Directory', sw: 'Orodha ya Wafanyakazi wa Kaunti', pok: 'Ng\'alekta' }) }}
      </h1>
      <p class="text-base-content/60 max-w-xl mx-auto">
        {{ t({ en: 'Meet the dedicated team serving West Pokot County.', sw: 'Kutana na timu inayohudumia Kaunti ya West Pokot.', pok: 'Ng\'alekta' }) }}
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-6 max-w-2xl mx-auto">
      <div class="join flex-1 min-w-0">
        <div class="join-item flex items-center px-3 bg-base-200 border border-base-300 border-r-0 rounded-l-lg">
          <Search class="w-4 h-4 text-base-content/40" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="input input-bordered join-item flex-1 min-w-0 border-l-0 rounded-r-lg"
          :placeholder="t({ en: 'Search by name or title...', sw: 'Tafuta kwa jina au cheo...', pok: 'Ng\'alekta...' })"
        />
      </div>
      <button v-if="searchQuery" @click="searchQuery = ''" class="btn btn-ghost btn-sm btn-square">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPersons.length === 0" class="text-center py-12 text-base-content/50">
      <UserCircle class="w-16 h-16 mx-auto mb-3 opacity-30" />
      <p class="font-medium text-lg">{{ t({ en: 'No staff members found', sw: 'Hakuna wafanyakazi waliopatikana', pok: 'Ng\'alekta' }) }}</p>
    </div>

    <!-- Staff Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="person in filteredPersons"
        :key="person.id"
        class="card bg-base-100 border border-base-200 hover:shadow-lg hover:border-primary/30 transition-all duration-200 rounded-xl overflow-hidden"
      >
        <!-- Photo -->
        <div class="h-40 bg-gradient-to-b from-primary/5 to-base-200 flex items-center justify-center">
          <img
            v-if="getPhotoUrl(person)"
            :src="getPhotoUrl(person)"
            :alt="person.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <span v-else class="text-3xl font-bold text-primary/40">{{ getInitials(person.name) }}</span>
        </div>

        <!-- Info -->
        <div class="p-4">
          <h3 class="font-semibold">{{ person.name }}</h3>
          <p class="text-sm text-primary/80 font-medium">{{ person.title }}</p>

          <!-- Bio preview -->
          <p
            v-if="person[`bio_${localeStore.locale}`]"
            class="text-xs text-base-content/60 mt-2 line-clamp-2"
          >
            {{ person[`bio_${localeStore.locale}`] }}
          </p>

          <!-- Expand for full bio + social links -->
          <button
            v-if="person[`bio_${localeStore.locale}`] && person[`bio_${localeStore.locale}`].length > 100"
            @click="toggleExpand(person.id)"
            class="btn btn-ghost btn-xs gap-1 mt-1 text-primary"
          >
            {{ expandedId === person.id ? 'Show less' : 'Read more' }}
            <ChevronDown v-if="expandedId !== person.id" class="w-3 h-3" />
            <ChevronUp v-else class="w-3 h-3" />
          </button>

          <!-- Expanded bio -->
          <p
            v-if="expandedId === person.id && person[`bio_${localeStore.locale}`]"
            class="text-xs text-base-content/60 mt-1"
          >
            {{ person[`bio_${localeStore.locale}`] }}
          </p>

          <!-- Social Links -->
          <div v-if="getSocialLinks(person).length > 0" class="flex gap-2 mt-3 pt-2 border-t border-base-200">
            <a
              v-for="link in getSocialLinks(person)"
              :key="link.platform"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-base-content/40 hover:text-primary transition-colors"
              :title="link.platform"
            >
              <Globe class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
