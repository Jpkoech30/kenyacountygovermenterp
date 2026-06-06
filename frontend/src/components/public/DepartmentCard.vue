<script setup>
/**
 * DepartmentCard — displays a department card.
 */
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { ArrowRight, Building2 } from '@lucide/vue'

const props = defineProps({
  content: { type: Object, required: true },
})

const localeStore = useLocaleStore()

const translation = computed(() => {
  return props.content.translations?.find(t => t.locale === localeStore.locale)
    || props.content.translations?.[0]
    || {}
})
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
    <div class="card-body p-5">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 class="w-5 h-5 text-primary" />
        </div>
        <h3 class="font-semibold text-sm">{{ translation.title }}</h3>
      </div>
      <p v-if="translation.excerpt" class="text-xs text-base-content/70 line-clamp-3">{{ translation.excerpt }}</p>
      <div class="card-actions mt-3">
        <router-link :to="`/departments/${content.slug}`" class="link link-primary text-xs flex items-center gap-1">
          View Department <ArrowRight class="w-3 h-3" />
        </router-link>
      </div>
    </div>
  </div>
</template>
