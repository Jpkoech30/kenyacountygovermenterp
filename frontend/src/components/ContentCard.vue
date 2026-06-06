<script setup>
/**
 * ContentCard.vue — Facebook-style content card for the news feed.
 * Features:
 * - Avatar + author name + timestamp header
 * - Title + excerpt body
 * - Optional featured image
 * - Like / Comment / Share action bar
 * - Hover effects and smooth transitions
 *
 * @emits like { id }
 * @emits comment { id }
 * @emits share { id }
 */
import { ref, computed } from 'vue'
import { ThumbsUp, MessageCircle, Share2 } from '@lucide/vue'

const props = defineProps({
  /** Content item object */
  item: { type: Object, required: true },
})

const emit = defineEmits(['like', 'comment', 'share'])

const liked = ref(false)
const likeCount = ref(props.item.likes || 0)

function handleLike() {
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
  emit('like', props.item.id)
}

function handleComment() {
  emit('comment', props.item.id)
}

function handleShare() {
  emit('share', props.item.id)
}

/** Format timestamp to relative time */
const relativeTime = computed(() => {
  const diff = Date.now() - new Date(props.item.createdAt || props.item.timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(props.item.createdAt).toLocaleDateString()
})

/** Get initials for avatar fallback */
const initials = computed(() => {
  const name = props.item.author || props.item.createdBy || 'User'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
})
</script>

<template>
  <article class="facebook-card overflow-hidden transition-shadow duration-200 hover:shadow-md">
    <!-- Header: avatar + author + timestamp -->
    <div class="flex items-center gap-3 px-4 pt-4 pb-2">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
        {{ initials }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">{{ item.author || item.createdBy || 'User' }}</p>
        <p class="text-xs text-gray-400">{{ relativeTime }}</p>
      </div>
      <!-- Content type badge -->
      <span v-if="item.type" class="badge badge-sm badge-ghost text-[10px] text-gray-400 capitalize">
        {{ item.type }}
      </span>
    </div>

    <!-- Body: title + excerpt -->
    <div class="px-4 pb-2">
      <h3 v-if="item.title" class="text-base font-semibold text-gray-900 mb-1 leading-snug">{{ item.title }}</h3>
      <p v-if="item.excerpt || item.content" class="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {{ item.excerpt || item.content }}
      </p>
    </div>

    <!-- Featured image -->
    <div v-if="item.featuredImage || item.image" class="px-0">
      <img
        :src="item.featuredImage || item.image"
        :alt="item.title || 'Content image'"
        class="w-full h-48 sm:h-56 object-cover"
        loading="lazy"
      />
    </div>

    <!-- Like count bar -->
    <div v-if="likeCount > 0" class="flex items-center gap-1.5 px-4 py-1.5 text-xs text-gray-400">
      <ThumbsUp class="w-3 h-3 text-primary" aria-hidden="true" />
      <span>{{ likeCount }}</span>
    </div>

    <!-- Divider -->
    <div class="border-t border-gray-100 mx-4"></div>

    <!-- Action bar: Like / Comment / Share -->
    <div class="flex items-center px-2 py-1">
      <button
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors duration-150"
        :class="liked ? 'text-primary hover:bg-primary/5' : 'text-gray-500 hover:bg-gray-100'"
        @click="handleLike"
        :aria-label="liked ? 'Unlike this post' : 'Like this post'"
      >
        <ThumbsUp class="w-4 h-4" :class="{ 'fill-primary': liked }" aria-hidden="true" />
        <span>{{ liked ? 'Liked' : 'Like' }}</span>
      </button>

      <button
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-md transition-colors duration-150"
        @click="handleComment"
        aria-label="Comment on this post"
      >
        <MessageCircle class="w-4 h-4" aria-hidden="true" />
        <span>Comment</span>
      </button>

      <button
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-md transition-colors duration-150"
        @click="handleShare"
        aria-label="Share this post"
      >
        <Share2 class="w-4 h-4" aria-hidden="true" />
        <span>Share</span>
      </button>
    </div>
  </article>
</template>
