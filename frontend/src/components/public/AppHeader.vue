<script setup>
/**
 * Public website header — two-tier layout:
 *   Top bar: logo, search, language switcher, accessibility toggle
 *   Subnav:  navigation links (horizontally scrollable on mobile, dropdowns on desktop)
 *
 * Navigation links are fetched from the backend Menu system (header location).
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocaleStore } from '../../stores/locale'
import { fetchPublicMenus } from '../../api/public'
import { Globe, Accessibility, Search, X, ChevronDown } from '@lucide/vue'

const emit = defineEmits(['toggle-accessibility'])

const route = useRoute()
const localeStore = useLocaleStore()

const headerMenu = ref(null)
const loading = ref(true)
const searchOpen = ref(false)
const searchQuery = ref('')

onMounted(async () => {
  try {
    headerMenu.value = await fetchPublicMenus('header')
  } catch (err) {
    console.error('Failed to load header menu:', err)
  } finally {
    loading.value = false
  }
})

/**
 * Get the localized title from a menu item.
 */
function t(item) {
  if (!item || !item.title) return ''
  const title = typeof item.title === 'string' ? JSON.parse(item.title) : item.title
  return title[localeStore.locale] || title.en || ''
}

/**
 * Resolve the router-link :to for a menu item.
 */
function itemTo(item) {
  switch (item.type) {
    case 'page':
      return item.target_slug ? `/page/${item.target_slug}` : '/'
    case 'category':
      return item.target_slug ? `/category/${item.target_slug}` : '/'
    case 'custom_url':
      return item.url || '/'
    case 'external_link':
      return item.url || '#'
    default:
      return '/'
  }
}

/**
 * Check if a menu item is an external link.
 */
function isExternal(item) {
  return item.type === 'external_link'
}

function hasChildren(item) {
  return item.children && item.children.length > 0
}

function isActive(item) {
  const to = itemTo(item)
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    window.location.href = `/search?q=${encodeURIComponent(searchQuery.value.trim())}`
  }
}

// Fallback links when menu is not available
const fallbackLinks = [
  { label: { en: 'Home', sw: 'Nyumbani', pok: 'Kokwo' }, to: '/' },
  { label: { en: 'About', sw: 'Kuhusu', pok: 'Kokiloe' }, to: '/about' },
  { label: { en: 'Departments', sw: 'Idara', pok: "Ng'alekta" }, to: '/departments' },
  { label: { en: 'News', sw: 'Habari', pok: "Ng'alek" }, to: '/news' },
  { label: { en: 'Events', sw: 'Matukio', pok: "Ng'alekta" }, to: '/events' },
  { label: { en: 'Tenders', sw: 'Zabuni', pok: 'Zabuni' }, to: '/tenders' },
  { label: { en: 'Vacancies', sw: 'Nafasi za Kazi', pok: 'Ng\'alekta' }, to: '/vacancies' },
  { label: { en: 'Contact', sw: 'Wasiliana', pok: 'Nyikwa' }, to: '/contact' },
]

const navItems = computed(() => {
  if (headerMenu.value?.items && headerMenu.value.items.length > 0) {
    return headerMenu.value.items
  }
  return fallbackLinks.map((link) => ({
    title: link.label,
    type: 'custom_url',
    url: link.to,
    children: [],
  }))
})
</script>

<template>
  <header class="sticky top-0 z-50">
    <!-- ── Top Bar: Logo + Utilities ─────────────────────────────── -->
    <div class="bg-base-100 border-b border-base-200">
      <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 shrink-0">
          <span class="text-xl font-bold tracking-tight text-primary">West Pokot</span>
          <span class="hidden sm:inline text-sm text-base-content/60 font-medium">County</span>
        </router-link>

        <!-- Right side: Search + Language + Accessibility -->
        <div class="flex items-center gap-1">
          <!-- Search -->
          <div class="relative">
            <button
              v-if="!searchOpen"
              class="btn btn-ghost btn-sm btn-square"
              @click="searchOpen = true"
              title="Search"
            >
              <Search class="w-4 h-4" />
            </button>
            <form v-else @submit.prevent="handleSearch" class="flex items-center gap-1">
              <input
                v-model="searchQuery"
                type="text"
                ref="searchInput"
                :placeholder="localeStore.locale === 'en' ? 'Search...' : localeStore.locale === 'sw' ? 'Tafuta...' : 'Ng\'alek...'"
                class="input input-xs input-bordered w-40 md:w-56"
                autofocus
              />
              <button type="submit" class="btn btn-ghost btn-xs btn-square">
                <Search class="w-3.5 h-3.5" />
              </button>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="searchOpen = false; searchQuery = ''">
                <X class="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <!-- Language Switcher -->
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-sm gap-1">
              <Globe class="w-4 h-4" />
              <span class="uppercase font-bold text-xs">{{ localeStore.locale }}</span>
            </label>
            <ul tabindex="0" class="dropdown-content menu menu-sm p-2 shadow bg-base-100 rounded-box w-32 z-[60]">
              <li>
                <button :class="{ active: localeStore.locale === 'en' }" @click="localeStore.setLocale('en')">
                  🇬🇧 English
                </button>
              </li>
              <li>
                <button :class="{ active: localeStore.locale === 'sw' }" @click="localeStore.setLocale('sw')">
                  🇰🇪 Kiswahili
                </button>
              </li>
              <li>
                <button :class="{ active: localeStore.locale === 'pok' }" @click="localeStore.setLocale('pok')">
                  🏴󠁫󠁥󠁷󠁰󠁿 Pökoot
                </button>
              </li>
            </ul>
          </div>

          <!-- Accessibility Toggle -->
          <button class="btn btn-ghost btn-sm btn-square" @click="$emit('toggle-accessibility')" title="Accessibility">
            <Accessibility class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Subnav: Navigation Links ──────────────────────────────── -->
    <nav class="subnav bg-base-100/95 backdrop-blur-md border-b border-base-300">
      <div class="max-w-7xl mx-auto px-4">
        <ul class="subnav-scroll flex items-center gap-0.5 overflow-x-auto py-0 scrollbar-hide">
          <template v-for="item in navItems" :key="item.id || item.to">
            <!-- Items with children (dropdown) -->
            <li v-if="hasChildren(item)" class="dropdown dropdown-hover shrink-0">
              <details class="subnav-details">
                <summary
                  class="subnav-link"
                  :class="{ 'subnav-link--active': isActive(item) }"
                >
                  {{ t(item) }}
                  <ChevronDown class="w-3 h-3" />
                </summary>
                <ul class="dropdown-content menu menu-sm p-2 shadow bg-base-100 rounded-box w-48 z-[55] -ml-2">
                  <li v-for="child in item.children" :key="child.id">
                    <a
                      v-if="isExternal(child)"
                      :href="itemTo(child)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm"
                    >
                      {{ t(child) }}
                    </a>
                    <router-link v-else :to="itemTo(child)" class="text-sm">
                      {{ t(child) }}
                    </router-link>
                  </li>
                </ul>
              </details>
            </li>
            <!-- Regular items -->
            <li v-else class="shrink-0">
              <a
                v-if="isExternal(item)"
                :href="itemTo(item)"
                target="_blank"
                rel="noopener noreferrer"
                class="subnav-link"
                :class="{ 'subnav-link--active': isActive(item) }"
              >
                {{ t(item) }}
              </a>
              <router-link
                v-else
                :to="itemTo(item)"
                class="subnav-link"
                :class="{ 'subnav-link--active': isActive(item) }"
              >
                {{ t(item) }}
              </router-link>
            </li>
          </template>
        </ul>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* ── Subnav link base ─────────────────────────────── */
.subnav-link {
  @apply flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap;
  color: theme('colors.base-content');
}
.subnav-link:hover {
  color: theme('colors.base-content');
  background: theme('colors.neutral');
}
.subnav-link--active {
  color: theme('colors.primary');
  background: theme('colors.primary / 8%');
  position: relative;
}
.subnav-link--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  border-radius: 1px;
  background: theme('colors.primary');
}

/* ── Subnav details (dropdown trigger) ────────────── */
.subnav-details {
  display: inline-flex;
}
.subnav-details > summary {
  list-style: none;
}
.subnav-details > summary::-webkit-details-marker {
  display: none;
}

/* ── Horizontal scroll container ──────────────────── */
.subnav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.subnav-scroll::-webkit-scrollbar {
  display: none;
}

/* ── Mobile: fade indicators on scroll edges ──────── */
.subnav {
  position: relative;
}
.subnav::before,
.subnav::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
}
.subnav::before {
  left: 0;
  background: linear-gradient(to right, theme('colors.base-100'), transparent);
}
.subnav::after {
  right: 0;
  background: linear-gradient(to left, theme('colors.base-100'), transparent);
}
</style>
