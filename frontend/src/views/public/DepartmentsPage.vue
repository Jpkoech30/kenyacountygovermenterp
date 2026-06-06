<script setup>
/**
 * DepartmentsPage — grid of all county departments.
 */
import { ref, onMounted, watch, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContent } from '../../api/public'
import DepartmentCard from '../../components/public/DepartmentCard.vue'
import { Search } from '@lucide/vue'

const localeStore = useLocaleStore()
const departments = ref([])
const loading = ref(true)
const searchQuery = ref('')

useHead({
  title: 'Departments — West Pokot County',
  meta: [{ name: 'description', content: 'Browse all county government departments and their services.' }],
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchContent({ type: 'department', limit: 50, locale: localeStore.locale })
    departments.value = res.content || []
  } catch {
    departments.value = []
  }
  loading.value = false
}

onMounted(loadData)
watch(() => localeStore.locale, loadData)

const filtered = computed(() => {
  if (!searchQuery.value) return departments.value
  const q = searchQuery.value.toLowerCase()
  return departments.value.filter((d) => {
    const t = d.translations?.[0]
    return t?.title?.toLowerCase().includes(q) || t?.excerpt?.toLowerCase().includes(q)
  })
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'County Departments' : localeStore.locale === 'sw' ? 'Idara za Kaunti' : 'Ng\'alekta' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'Browse all county government departments and their services.' : localeStore.locale === 'sw' ? 'Pitia idara zote za serikali ya kaunti na huduma zao.' : 'Ng\'alekta.' }}
    </p>

    <!-- Search -->
    <div class="form-control max-w-md mb-8">
      <label class="input input-bordered input-sm flex items-center gap-2">
        <Search class="w-4 h-4" />
        <input v-model="searchQuery" type="text" :placeholder="localeStore.locale === 'en' ? 'Search departments...' : localeStore.locale === 'sw' ? 'Tafuta idara...' : 'Ng\'alekta...'" class="grow" />
      </label>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DepartmentCard v-for="dept in filtered" :key="dept.id" :content="dept" />
      <p v-if="filtered.length === 0" class="col-span-full text-center text-base-content/60 py-12">
        {{ localeStore.locale === 'en' ? 'No departments found.' : localeStore.locale === 'sw' ? 'Hakuna idara zilizopatikana.' : 'Ng\'alek.' }}
      </p>
    </div>
  </div>
</template>
