<script setup>
/**
 * VacancyTable — displays open vacancies in a table.
 */
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'

const props = defineProps({
  vacancies: { type: Array, required: true },
})

const localeStore = useLocaleStore()

const translation = (vacancy) => {
  return vacancy.translations?.find(t => t.locale === localeStore.locale)
    || vacancy.translations?.[0]
    || {}
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB')
}

function getMeta(vacancy, key) {
  return vacancy.meta?.find(m => m.meta_key === key)?.meta_value || ''
}

function isExpired(vacancy) {
  const closing = getMeta(vacancy, 'closing_date')
  return closing && new Date(closing) < new Date()
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra table-sm">
      <thead>
        <tr>
          <th>{{ localeStore.locale === 'en' ? 'Position' : localeStore.locale === 'sw' ? 'Nafasi' : 'Ng\'alek' }}</th>
          <th>{{ localeStore.locale === 'en' ? 'Requirements' : localeStore.locale === 'sw' ? 'Mahitaji' : 'Ng\'alek' }}</th>
          <th>{{ localeStore.locale === 'en' ? 'Closing Date' : localeStore.locale === 'sw' ? 'Tarehe ya Kufunga' : 'Ng\'alek' }}</th>
          <th>{{ localeStore.locale === 'en' ? 'Status' : localeStore.locale === 'sw' ? 'Hali' : 'Ng\'alek' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vacancy in vacancies" :key="vacancy.id" :class="{ 'opacity-50': isExpired(vacancy) }">
          <td class="font-medium text-sm">{{ translation(vacancy).title }}</td>
          <td class="text-xs text-base-content/70 max-w-xs">
            {{ getMeta(vacancy, 'requirements') || translation(vacancy).excerpt }}
          </td>
          <td class="text-sm">{{ formatDate(getMeta(vacancy, 'closing_date')) }}</td>
          <td>
            <span class="badge badge-sm" :class="isExpired(vacancy) ? 'badge-ghost' : 'badge-success'">
              {{ isExpired(vacancy) ? 'Closed' : 'Open' }}
            </span>
          </td>
        </tr>
        <tr v-if="vacancies.length === 0">
          <td colspan="4" class="text-center text-sm text-base-content/60 py-8">
            {{ localeStore.locale === 'en' ? 'No vacancies available.' : localeStore.locale === 'sw' ? 'Hakuna nafasi.' : 'Ng\'alek.' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
