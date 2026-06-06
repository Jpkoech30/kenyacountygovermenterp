<script setup>
/**
 * TenderTable — displays open tenders in a table.
 */
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { FileText, ExternalLink } from '@lucide/vue'

const props = defineProps({
  tenders: { type: Array, required: true },
})

const localeStore = useLocaleStore()

const translation = (tender) => {
  return tender.translations?.find(t => t.locale === localeStore.locale)
    || tender.translations?.[0]
    || {}
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB')
}

function getMeta(tender, key) {
  return tender.meta?.find(m => m.meta_key === key)?.meta_value || ''
}

function isExpired(tender) {
  const closing = getMeta(tender, 'closing_date')
  return closing && new Date(closing) < new Date()
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra table-sm">
      <thead>
        <tr>
          <th>{{ localeStore.locale === 'en' ? 'Title' : localeStore.locale === 'sw' ? 'Kichwa' : 'Ng\'alek' }}</th>
          <th>{{ localeStore.locale === 'en' ? 'Closing Date' : localeStore.locale === 'sw' ? 'Tarehe ya Kufunga' : 'Ng\'alek' }}</th>
          <th>{{ localeStore.locale === 'en' ? 'Status' : localeStore.locale === 'sw' ? 'Hali' : 'Ng\'alek' }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tender in tenders" :key="tender.id" :class="{ 'opacity-50': isExpired(tender) }">
          <td class="font-medium text-sm">{{ translation(tender).title }}</td>
          <td class="text-sm">{{ formatDate(getMeta(tender, 'closing_date')) }}</td>
          <td>
            <span class="badge badge-sm" :class="isExpired(tender) ? 'badge-ghost' : 'badge-success'">
              {{ isExpired(tender) ? 'Closed' : 'Open' }}
            </span>
          </td>
          <td>
            <a v-if="getMeta(tender, 'tender_document_url')" :href="getMeta(tender, 'tender_document_url')" target="_blank" class="btn btn-ghost btn-xs">
              <FileText class="w-3 h-3" /> PDF
            </a>
          </td>
        </tr>
        <tr v-if="tenders.length === 0">
          <td colspan="4" class="text-center text-sm text-base-content/60 py-8">
            {{ localeStore.locale === 'en' ? 'No tenders available.' : localeStore.locale === 'sw' ? 'Hakuna zabuni.' : 'Ng\'alek.' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
