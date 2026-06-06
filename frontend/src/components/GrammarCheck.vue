<script setup>
/**
 * GrammarCheck.vue - Diff viewer for grammar check results.
 * Displays original vs corrected text with color-coded changes highlighted.
 */
import { computed } from 'vue'

const props = defineProps({
  /** The grammar check result from the API */
  result: { type: Object, required: true },
  /** Label for the original text column */
  originalLabel: { type: String, default: 'Original' },
  /** Label for the corrected text column */
  correctedLabel: { type: String, default: 'Corrected' },
})

/**
 * Compute diff segments by comparing original and corrected text word-by-word.
 * Returns an array of { text, type: 'same'|'added'|'removed' } objects.
 */
const diffSegments = computed(() => {
  const original = props.result.original || ''
  const corrected = props.result.corrected || ''

  if (!original && !corrected) return []
  if (original === corrected) {
    return [{ text: corrected, type: 'same' }]
  }

  // Simple word-level diff
  const origWords = original.split(/(\s+)/)
  const corrWords = corrected.split(/(\s+)/)

  const segments = []
  let oi = 0
  let ci = 0

  while (oi < origWords.length || ci < corrWords.length) {
    if (oi < origWords.length && ci < corrWords.length && origWords[oi] === corrWords[ci]) {
      segments.push({ text: origWords[oi], type: 'same' })
      oi++
      ci++
    } else {
      // Collect removed words
      let removed = ''
      while (oi < origWords.length && (ci >= corrWords.length || origWords[oi] !== corrWords[ci])) {
        removed += origWords[oi]
        oi++
      }
      if (removed) {
        segments.push({ text: removed, type: 'removed' })
      }

      // Collect added words
      let added = ''
      while (ci < corrWords.length && (oi >= origWords.length || corrWords[ci] !== origWords[oi])) {
        added += corrWords[ci]
        ci++
      }
      if (added) {
        segments.push({ text: added, type: 'added' })
      }
    }
  }

  return segments
})

/**
 * List of individual changes for display.
 */
const changes = computed(() => {
  return (props.result.changes || []).map((c, i) => ({
    id: i,
    original: c.original || '',
    corrected: c.corrected || '',
    type: c.type || 'correction',
  }))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Diff view: side-by-side or stacked -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Original -->
      <div class="space-y-1">
        <h4 class="text-sm font-medium text-base-content/60">{{ originalLabel }}</h4>
        <div class="bg-base-300 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
          <template v-if="result.original">
            {{ result.original }}
          </template>
          <span v-else class="text-base-content/30 italic">No original text</span>
        </div>
      </div>

      <!-- Corrected -->
      <div class="space-y-1">
        <h4 class="text-sm font-medium text-success">{{ correctedLabel }}</h4>
        <div class="bg-base-300 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
          <template v-if="diffSegments.length">
            <span
              v-for="(seg, i) in diffSegments"
              :key="i"
              :class="{
                'bg-success/20 text-success font-medium rounded px-0.5': seg.type === 'added',
                'bg-error/20 text-error line-through rounded px-0.5': seg.type === 'removed',
              }"
            >{{ seg.text }}</span>
          </template>
          <span v-else-if="result.corrected">{{ result.corrected }}</span>
          <span v-else class="text-base-content/30 italic">No corrected text</span>
        </div>
      </div>
    </div>

    <!-- Changes list -->
    <div v-if="changes.length > 0" class="space-y-2">
      <h4 class="text-sm font-medium text-base-content/60">
        Changes ({{ changes.length }})
      </h4>
      <div class="space-y-1">
        <div
          v-for="change in changes"
          :key="change.id"
          class="flex items-start gap-2 text-sm bg-base-200 rounded-lg p-2"
        >
          <span class="mt-0.5 text-warning">✏️</span>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span class="text-error line-through text-xs">{{ change.original }}</span>
              <span class="text-base-content/30">→</span>
              <span class="text-success font-medium text-xs">{{ change.corrected }}</span>
            </div>
            <span v-if="change.type" class="text-xs text-base-content/40 capitalize">
              ({{ change.type }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
