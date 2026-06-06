<script setup>
/**
 * HomePage — hero carousel, quick service cards, fact rotator, latest news, upcoming events, profiles.
 */
import { ref, onMounted, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import { fetchContent, fetchEvents, fetchPersons } from '../../api/public'
import HeroCarousel from '../../components/public/HeroCarousel.vue'
import WeatherWidget from '../../components/public/WeatherWidget.vue'
import FactRotator from '../../components/public/FactRotator.vue'
import NewsCard from '../../components/public/NewsCard.vue'
import EventCard from '../../components/public/EventCard.vue'
import { ArrowRight, FileText, Building2, HeartPulse, GraduationCap, ScrollText } from '@lucide/vue'

const localeStore = useLocaleStore()

const latestNews = ref([])
const upcomingEvents = ref([])
const governor = ref(null)
const deputy = ref(null)
const loading = ref(true)

useHead({
  title: 'West Pokot County Government — Official Website',
  meta: [
    { name: 'description', content: 'Official website of the West Pokot County Government. Find information about county services, news, events, tenders, and departments.' },
  ],
})

async function loadData() {
  loading.value = true
  try {
    const [newsRes, eventsRes, govRes, depRes] = await Promise.all([
      fetchContent({ type: 'news', limit: 3, locale: localeStore.locale }),
      fetchEvents({ upcoming: true, limit: 3, locale: localeStore.locale }),
      fetchPersons({ title: 'governor' }),
      fetchPersons({ title: 'deputy' }),
    ])
    latestNews.value = newsRes.content || []
    upcomingEvents.value = eventsRes.events || []
    governor.value = govRes[0] || null
    deputy.value = depRes[0] || null
  } catch {
    // silently fail
  }
  loading.value = false
}

onMounted(loadData)
watch(() => localeStore.locale, loadData)

const quickServices = [
  { icon: ScrollText, label: { en: 'eCitizen Services', sw: 'Huduma za eCitizen', pok: 'Ng\'alekta' }, to: 'https://ecitizen.go.ke' },
  { icon: FileText, label: { en: 'Business Permits', sw: 'Leseni za Biashara', pok: 'Ng\'alekta' }, to: '/apply-permit' },
  { icon: HeartPulse, label: { en: 'Health Services', sw: 'Huduma za Afya', pok: 'Ng\'alekta' }, to: '/departments/health-services' },
  { icon: GraduationCap, label: { en: 'Education', sw: 'Elimu', pok: 'Ng\'alekta' }, to: '/departments/education' },
  { icon: Building2, label: { en: 'Tenders', sw: 'Zabuni', pok: 'Zabuni' }, to: '/tenders' },
  { icon: ScrollText, label: { en: 'Vacancies', sw: 'Nafasi za Kazi', pok: 'Ng\'alekta' }, to: '/vacancies' },
]

function t(label) {
  return label[localeStore.locale] || label.en
}
</script>

<template>
  <div>
    <!-- Hero Carousel -->
    <HeroCarousel />

    <div class="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <!-- Quick Service Cards -->
      <section>
        <h2 class="text-2xl font-bold mb-6 text-center">
          {{ t({ en: 'Quick Services', sw: 'Huduma za Haraka', pok: 'Ng\'alekta' }) }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a
            v-for="service in quickServices"
            :key="service.label.en"
            :href="service.to"
            class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary transition-all p-4 text-center"
          >
            <div class="card-body p-0 items-center">
              <component :is="service.icon" class="w-8 h-8 text-primary mb-2" />
              <span class="text-xs font-medium">{{ t(service.label) }}</span>
            </div>
          </a>
        </div>
      </section>

      <!-- Weather + Fact Rotator row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
          <FactRotator />
        </div>
        <WeatherWidget />
      </div>

      <!-- Latest News -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">
            {{ t({ en: 'Latest News', sw: 'Habari Mpya', pok: 'Ng\'alek' }) }}
          </h2>
          <router-link to="/news" class="link link-primary text-sm flex items-center gap-1">
            {{ t({ en: 'View All', sw: 'Angalia Zote', pok: 'Ng\'alekta' }) }} <ArrowRight class="w-3 h-3" />
          </router-link>
        </div>
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NewsCard v-for="item in latestNews" :key="item.id" :content="item" />
          <p v-if="latestNews.length === 0" class="col-span-full text-center text-base-content/60 py-8">
            {{ t({ en: 'No news articles yet.', sw: 'Hakuna habari bado.', pok: 'Ng\'alek.' }) }}
          </p>
        </div>
      </section>

      <!-- Upcoming Events -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">
            {{ t({ en: 'Upcoming Events', sw: 'Matukio Yajayo', pok: 'Ng\'alekta' }) }}
          </h2>
          <router-link to="/events" class="link link-primary text-sm flex items-center gap-1">
            {{ t({ en: 'View All', sw: 'Angalia Yote', pok: 'Ng\'alekta' }) }} <ArrowRight class="w-3 h-3" />
          </router-link>
        </div>
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EventCard v-for="item in upcomingEvents" :key="item.id" :content="item" />
          <p v-if="upcomingEvents.length === 0" class="col-span-full text-center text-base-content/60 py-8">
            {{ t({ en: 'No upcoming events.', sw: 'Hakuna matukio yajayo.', pok: 'Ng\'alek.' }) }}
          </p>
        </div>
      </section>

      <!-- Governor & Deputy Profiles -->
      <section v-if="governor || deputy">
        <h2 class="text-2xl font-bold mb-6 text-center">
          {{ t({ en: 'County Leadership', sw: 'Uongozi wa Kaunti', pok: 'Ng\'alekta' }) }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div v-if="governor" class="card bg-base-100 shadow-sm border border-base-200 text-center">
            <figure class="px-6 pt-6">
              <div class="w-32 h-32 rounded-full overflow-hidden mx-auto bg-base-200">
                <img
                  v-if="governor.media"
                  :src="`/media/${governor.media.disk_filename}`"
                  :alt="governor.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-4xl text-base-content/30">👤</div>
              </div>
            </figure>
            <div class="card-body">
              <h3 class="font-bold text-lg">{{ governor.name }}</h3>
              <p class="text-sm text-base-content/70">{{ governor.title }}</p>
              <p v-if="governor[`bio_${localeStore.locale}`]" class="text-xs text-base-content/60 mt-2 line-clamp-3">
                {{ governor[`bio_${localeStore.locale}`] }}
              </p>
            </div>
          </div>

          <div v-if="deputy" class="card bg-base-100 shadow-sm border border-base-200 text-center">
            <figure class="px-6 pt-6">
              <div class="w-32 h-32 rounded-full overflow-hidden mx-auto bg-base-200">
                <img
                  v-if="deputy.media"
                  :src="`/media/${deputy.media.disk_filename}`"
                  :alt="deputy.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-4xl text-base-content/30">👤</div>
              </div>
            </figure>
            <div class="card-body">
              <h3 class="font-bold text-lg">{{ deputy.name }}</h3>
              <p class="text-sm text-base-content/70">{{ deputy.title }}</p>
              <p v-if="deputy[`bio_${localeStore.locale}`]" class="text-xs text-base-content/60 mt-2 line-clamp-3">
                {{ deputy[`bio_${localeStore.locale}`] }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
