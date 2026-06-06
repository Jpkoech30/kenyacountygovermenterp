<script setup>
/**
 * HeroCarousel — DaisyUI carousel for hero slides.
 * Fetches from /api/public/hero-slides.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchHeroSlides } from '../../api/public'

const slides = ref([])
const current = ref(0)
let interval = null

onMounted(async () => {
  try {
    slides.value = await fetchHeroSlides()
  } catch {
    // silently fail
  }
  interval = setInterval(() => {
    if (slides.value.length > 0) {
      current.value = (current.value + 1) % slides.value.length
    }
  }, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function goTo(index) {
  current.value = index
}

function getImageUrl(slide) {
  if (slide.media && slide.media.disk_filename) {
    return `/storage/media/${slide.media.storage_path || slide.media.disk_filename}`
  }
  return slide.image_url || 'https://placehold.co/1200x400?text=West+Pokot'
}
</script>

<template>
  <div v-if="slides.length > 0" class="relative w-full overflow-hidden">
    <div class="carousel w-full">
      <div
        v-for="(slide, idx) in slides"
        :key="slide.id"
        :id="`slide-${idx}`"
        class="carousel-item relative w-full"
        :class="{ hidden: idx !== current }"
      >
        <img
          :src="getImageUrl(slide)"
          :alt="slide.title || 'Hero slide'"
          class="w-full h-[300px] md:h-[450px] object-cover"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 md:p-12">
          <div class="text-white max-w-2xl">
            <h2 class="text-2xl md:text-4xl font-bold mb-2">{{ slide.title }}</h2>
            <p v-if="slide.subtitle" class="text-sm md:text-lg opacity-90">{{ slide.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation dots -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
      <button
        v-for="(slide, idx) in slides"
        :key="idx"
        class="w-3 h-3 rounded-full transition-colors"
        :class="idx === current ? 'bg-white' : 'bg-white/50'"
        @click="goTo(idx)"
      />
    </div>
  </div>
</template>
