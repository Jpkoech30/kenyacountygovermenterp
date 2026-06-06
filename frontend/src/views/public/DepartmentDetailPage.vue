<script setup>
/**
 * DepartmentDetailPage — single department detail.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContentBySlug } from '../../api/public'
import { ArrowLeft, Building2, Phone, Mail, MapPin } from '@lucide/vue'

const route = useRoute()
const localeStore = useLocaleStore()
const department = ref(null)
const loading = ref(true)

const translation = computed(() => {
  if (!department.value) return {}
  return department.value.translations?.find(t => t.locale === localeStore.locale)
    || department.value.translations?.[0]
    || {}
})

useHead({
  title: computed(() => `${translation.value.title || 'Department'} — West Pokot County`),
})

onMounted(async () => {
  try {
    department.value = await fetchContentBySlug(route.params.slug)
  } catch {
    department.value = null
  }
  loading.value = false
})

function getMeta(key) {
  return department.value?.meta?.find(m => m.meta_key === key)?.meta_value || ''
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <router-link to="/departments" class="link link-primary text-sm flex items-center gap-1 mb-6">
      <ArrowLeft class="w-4 h-4" />
      {{ localeStore.locale === 'en' ? 'Back to Departments' : localeStore.locale === 'sw' ? 'Rudi kwa Idara' : 'Ng\'alekta' }}
    </router-link>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="department" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 class="w-6 h-6 text-primary" />
          </div>
          <h1 class="text-2xl md:text-3xl font-bold">{{ translation.title }}</h1>
        </div>

        <div v-if="translation.body" class="prose max-w-none mb-6" v-html="translation.body"></div>
        <p v-else-if="translation.excerpt" class="text-base-content/70 mb-6">{{ translation.excerpt }}</p>

        <!-- Contact Info from meta -->
        <div v-if="getMeta('contact_email') || getMeta('contact_phone') || getMeta('physical_address')" class="border-t pt-6 mt-4">
          <h2 class="font-bold text-lg mb-3">
            {{ localeStore.locale === 'en' ? 'Contact Information' : localeStore.locale === 'sw' ? 'Maelezo ya Mawasiliano' : 'Ng\'alekta' }}
          </h2>
          <div class="space-y-2 text-sm">
            <p v-if="getMeta('contact_email')" class="flex items-center gap-2">
              <Mail class="w-4 h-4 text-primary" /> {{ getMeta('contact_email') }}
            </p>
            <p v-if="getMeta('contact_phone')" class="flex items-center gap-2">
              <Phone class="w-4 h-4 text-primary" /> {{ getMeta('contact_phone') }}
            </p>
            <p v-if="getMeta('physical_address')" class="flex items-center gap-2">
              <MapPin class="w-4 h-4 text-primary" /> {{ getMeta('physical_address') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-base-content/60">
      {{ localeStore.locale === 'en' ? 'Department not found.' : localeStore.locale === 'sw' ? 'Idara haikupatikana.' : 'Ng\'alek.' }}
    </div>
  </div>
</template>
