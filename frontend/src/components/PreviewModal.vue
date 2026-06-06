<script setup>
/**
 * PreviewModal.vue - Modal for previewing rendered HTML content.
 * Displays the content title, body, excerpt, and metadata in a clean preview layout.
 */
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  content: {
    type: Object,
    default: null,
  },
  locale: {
    type: String,
    default: 'en',
  },
})

const emit = defineEmits(['close'])

const localeLabels = {
  en: 'English',
  sw: 'Kiswahili',
  pok: 'Pokot',
}

const currentTranslation = computed(() => {
  if (!props.content) return null
  const translations = props.content.translations || []
  return translations.find((t) => t.locale === props.locale) || translations[0] || null
})

const statusBadgeClass = (status) => {
  const classes = {
    draft: 'badge-ghost',
    pending_review: 'badge-warning',
    approved: 'badge-info',
    scheduled: 'badge-secondary',
    published: 'badge-success',
    archived: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function close() {
  emit('close')
}
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="show && content"
    class="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/50 overflow-y-auto"
    @click.self="close"
  >
    <div class="modal-box max-w-3xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold">Content Preview</h3>
          <span
            class="badge"
            :class="statusBadgeClass(content.status)"
          >
            {{ content.status?.replace('_', ' ') }}
          </span>
        </div>
        <button class="btn btn-sm btn-circle btn-ghost" @click="close">✕</button>
      </div>

      <!-- Meta info bar -->
      <div class="flex flex-wrap gap-4 text-sm text-base-content/60 mb-6 pb-4 border-b border-base-300">
        <span>Type: <strong>{{ content.type }}</strong></span>
        <span>Slug: <strong>{{ content.slug }}</strong></span>
        <span>Locale: <strong>{{ localeLabels[locale] || locale }}</strong></span>
        <span v-if="content.author">
          Author: <strong>{{ content.author.first_name }} {{ content.author.last_name }}</strong>
        </span>
        <span v-if="content.published_at">
          Published: <strong>{{ formatDate(content.published_at) }}</strong>
        </span>
      </div>

      <!-- Preview Content -->
      <article class="prose prose-lg max-w-none">
        <!-- Title -->
        <h1 class="text-3xl font-bold mb-6">
          {{ currentTranslation?.title || 'Untitled' }}
        </h1>

        <!-- Featured Image -->
        <img
          v-if="currentTranslation?.featuredImage"
          :src="`/media/${currentTranslation.featuredImage.disk_filename}`"
          :alt="currentTranslation.featuredImage.alt_text || currentTranslation.title"
          class="w-full rounded-lg mb-6 max-h-96 object-cover"
        />

        <!-- Excerpt -->
        <div
          v-if="currentTranslation?.excerpt"
          class="text-lg italic text-base-content/70 mb-6 p-4 bg-base-200 rounded-lg"
        >
          {{ currentTranslation.excerpt }}
        </div>

        <!-- Body Content (rendered HTML) -->
        <div
          v-if="currentTranslation?.body"
          class="content-body"
          v-html="currentTranslation.body"
        ></div>

        <p v-else class="text-base-content/50 italic">No content body.</p>
      </article>

      <!-- Taxonomies -->
      <div
        v-if="content.taxonomies?.length"
        class="mt-6 pt-4 border-t border-base-300"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tax in content.taxonomies"
            :key="tax.id"
            class="badge badge-outline"
          >
            {{ tax.name }}
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button class="btn btn-ghost" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.content-body :deep(a) {
  color: hsl(var(--p));
  text-decoration: underline;
}

.content-body :deep(blockquote) {
  border-left: 3px solid hsl(var(--p));
  padding-left: 1rem;
  margin: 1rem 0;
  color: hsl(var(--bc) / 0.7);
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3),
.content-body :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.content-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.content-body :deep(th),
.content-body :deep(td) {
  border: 1px solid hsl(var(--bc) / 0.2);
  padding: 0.5rem;
  text-align: left;
}

.content-body :deep(th) {
  background: hsl(var(--b2));
  font-weight: 600;
}
</style>
