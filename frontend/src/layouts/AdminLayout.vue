<style>
/* ── Admin Layout — Slack-Inspired ─────────────────────────────────── */

/* Sidebar link: base + hover + active + focus-visible */
.sidebar-link {
  border-radius: 0.375rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
.sidebar-link:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
}
.sidebar-link.active {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: 600;
  position: relative;
}
.sidebar-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: theme('colors.primary');
  border-radius: 0 2px 2px 0;
}

/* Top nav link hover (white navbar) */
.nav-icon-btn {
  transition: background-color 0.15s ease;
  color: theme('colors.base-content');
}
.nav-icon-btn:hover {
  background-color: theme('colors.base-300');
}
.nav-icon-btn:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
}

/* Quick action links (deprecated — kept for compatibility) */
.quick-action-link {
  color: theme('colors.base-content / 85%');
  transition: color 0.15s ease, background-color 0.15s ease;
  border-radius: 0.375rem;
}
.quick-action-link:hover {
  color: theme('colors.base-content');
  background-color: theme('colors.base-300');
}

/* Card surface */
.facebook-card {
  background-color: theme('colors.base-200');
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  border: 1px solid theme('colors.base-300');
}

/* Scrollbar hide utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Breadcrumb styling (on white bg) */
.breadcrumbs a {
  color: theme('colors.base-content / 60%');
}
.breadcrumbs a:hover {
  color: theme('colors.primary');
}
.breadcrumbs a:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
  border-radius: 2px;
}
</style>

<script setup>
/**
 * Admin Layout with role-based sidebar drawer and top navbar.
 * Uses DaisyUI drawer, menu, and details components.
 * Role visibility:
 *   admin          → all modules
 *   communication_editor → Communication only
 *   revenue_officer, revenue_clerk, cyber_provider → Revenue only
 *   hr_officer     → HCM (all 6 sub-items)
 *   supervisor     → HCM (My Team, Team Leave, Team Performance)
 *   employee       → HCM (My Leave, My Attendance, My Performance)
 *   health_officer, health_worker, health_manager, health_records_officer, pharmacy_tech → Health (Facility Management)
 *   community_health_officer → Health (Facility Management + Community Health admin)
 *   chv → Health (CHV view)
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  Image,
  Tag,
  DollarSign,
  FileCheck,
  ClipboardList,
  BarChart,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Star,
  Scale,
  Heart,
  Package,
  Megaphone,
  Stethoscope,
  Puzzle,
  Settings,
  TreePine,
  Home,
  Clipboard,
  CalendarCheck,
  Truck,
  Activity,
  Globe,
  CalendarDays,
  ScrollText,
  Briefcase,
  Building2,
  UserCircle,
  Quote,
  Images,
  Menu,
  ChevronDown,
  Moon,
  ChevronRight,
  Search,
  Pin,
  ClipboardCheck,
  Mail,
} from '@lucide/vue'
import ToastContainer from '../components/ToastContainer.vue'
import SearchBar from '../components/SearchBar.vue'
import NotificationDropdown from '../components/NotificationDropdown.vue'
import MobileBottomNav from '../components/MobileBottomNav.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const drawerOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')

// ── Pinned shortcuts (persisted in localStorage) ──
const pinnedModules = ref(loadPinned())

function loadPinned() {
  try {
    const saved = localStorage.getItem('sidebarPins')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function savePinned(pins) {
  localStorage.setItem('sidebarPins', JSON.stringify(pins))
}

function togglePin(modKey) {
  const idx = pinnedModules.value.indexOf(modKey)
  if (idx === -1) {
    pinnedModules.value.push(modKey)
  } else {
    pinnedModules.value.splice(idx, 1)
  }
  savePinned(pinnedModules.value)
}

function isPinned(modKey) {
  return pinnedModules.value.includes(modKey)
}

// ── Sidebar collapsible sections ──
const sidebarSections = ref({
  shortcuts: true,
  modules: true,
  admin: true,
})

function toggleSidebarSection(section) {
  sidebarSections.value[section] = !sidebarSections.value[section]
}

function handleSearch({ query }) {
  searchQuery.value = query
  // Future: route to search results page or filter content
  console.log('Search:', query)
}

function handleSearchSubmit({ query }) {
  searchQuery.value = query
  // Future: navigate to search results page
  if (query.trim()) {
    // router.push({ name: 'SearchResults', query: { q: query } })
  }
}

// ── Close drawer on route change (mobile) ──
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  }
)

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}

function toggleDarkMode() {
  const html = document.querySelector('html')
  const currentTheme = html.getAttribute('data-theme')
  const newTheme = currentTheme === 'county-dark' ? 'county' : 'county-dark'
  html.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

// ── Breadcrumb generation ──
const breadcrumbs = computed(() => {
  const crumbs = []
  const path = route.path
  const name = route.name

  // Always start with Dashboard
  crumbs.push({ label: 'Dashboard', to: '/dashboard' })

  // Add module-level breadcrumb based on path prefix
  if (path.startsWith('/website') || path.startsWith('/cms')) {
    crumbs.push({ label: 'Content Management', to: '/website/news' })
  } else if (path.startsWith('/admin/permits')) {
    crumbs.push({ label: 'Revenue', to: '/admin/permits' })
  } else if (path.startsWith('/admin/hr')) {
    crumbs.push({ label: 'HCM', to: '/admin/hr/employees' })
  } else if (path.startsWith('/health')) {
    crumbs.push({ label: 'Health', to: '/health/dashboard' })
  } else if (path.startsWith('/community-health')) {
    crumbs.push({ label: 'Community Health', to: '/community-health/dashboard' })
  } else if (path.startsWith('/chv')) {
    crumbs.push({ label: 'CHV', to: '/chv/dashboard' })
  }

  // Add page-specific breadcrumb from route meta
  if (route.meta?.breadcrumb) {
    crumbs.push({ label: route.meta.breadcrumb, to: null })
  } else if (name && typeof name === 'string') {
    // Derive from route name as fallback
    const pageLabel = name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    crumbs.push({ label: pageLabel, to: null })
  }

  return crumbs
})

// ── Role helpers ──────────────────────────────────────────────
const userRole = computed(() => authStore.userRole)
const isAdmin = computed(() => authStore.isAdmin)

const isHrOfficer = computed(() => userRole.value === 'hr_officer')
const isSupervisor = computed(() => userRole.value === 'supervisor')
const isEmployee = computed(() => userRole.value === 'employee')
const isRevenue = computed(() =>
  ['revenue_officer', 'revenue_clerk', 'cyber_provider'].includes(userRole.value)
)
const isHealth = computed(() =>
  [
    'health_officer', 'health_worker', 'health_manager',
    'health_records_officer', 'pharmacy_tech',
    'community_health_officer', 'chv',
  ].includes(userRole.value)
)
const isCommunicationEditor = computed(() => userRole.value === 'communication_editor')
const isFacilityHealth = computed(() =>
  ['health_officer', 'health_worker', 'health_manager', 'health_records_officer', 'pharmacy_tech'].includes(userRole.value)
)
const isCommunityHealthOfficer = computed(() => userRole.value === 'community_health_officer')
const isChv = computed(() => userRole.value === 'chv')
const isContentEditor = computed(() =>
  isAdmin.value || isCommunicationEditor.value || userRole.value === 'editor'
)

// ── Active module detection for top navbar ──
const activeModuleKey = computed(() => {
  const path = route.path
  if (path.startsWith('/website') || path.startsWith('/cms')) return 'website'
  if (path.startsWith('/admin/permits')) return 'revenue'
  if (path.startsWith('/admin/hr') || path.startsWith('/admin/staff')) return 'hcm'
  if (path.startsWith('/health')) return 'health'
  if (path.startsWith('/community-health')) return 'community-health'
  if (path.startsWith('/chv')) return 'chv'
  return null
})

// ── Website Content links for top navbar ──
// All Content Management links are grouped into a single "Content" dropdown
// to reduce navbar clutter. The sidebar drawer provides the full navigation.
const websiteContentLinks = computed(() => {
  if (!isContentEditor.value) return []
  const links = [
    { key: 'allContent', label: 'All Content', icon: FileText, to: '/cms/content' },
    { key: 'media', label: 'Media Library', icon: Image, to: '/cms/media' },
    { key: 'categories', label: 'Categories', icon: Tag, to: '/cms/categories' },
    { key: 'staff', label: 'User Accounts', icon: UserCircle, to: '/admin/staff' },
    { key: 'news', label: 'News', icon: Newspaper, to: '/website/news' },
    { key: 'events', label: 'Events', icon: CalendarDays, to: '/website/events' },
    { key: 'tenders', label: 'Tenders', icon: ScrollText, to: '/website/tenders' },
    { key: 'vacancies', label: 'Vacancies', icon: Briefcase, to: '/website/vacancies' },
    { key: 'departments', label: 'Departments', icon: Building2, to: '/website/departments' },
    { key: 'persons', label: 'Persons', icon: UserCircle, to: '/website/persons' },
    { key: 'facts', label: 'Facts', icon: Quote, to: '/website/facts' },
    { key: 'heroSlides', label: 'Hero Slides', icon: Images, to: '/website/hero-slides' },
  ]
  // Navigation Menus — admin only (matches sidebar visibility)
  if (isAdmin.value) {
    links.push({ key: 'menus', label: 'Menus', icon: Menu, to: '/cms/menus' })
  }
  return links
})

// ── Revenue links for top navbar ──
const revenueLinks = computed(() => {
  if (!isAdmin.value && !isRevenue.value) return []
  return [
    { key: 'permits', label: 'Permits', icon: FileCheck, to: '/admin/permits' },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList, to: '/admin/permits/assign' },
    { key: 'reports', label: 'Reports', icon: BarChart, to: '/admin/permits/reports' },
  ]
})

// ── HCM links for top navbar ──
const hcmLinks = computed(() => {
  if (isAdmin.value || isHrOfficer.value) {
    return [
      { key: 'employees', label: 'Employees', icon: Users, to: '/admin/hr/employees' },
      { key: 'leave', label: 'Leave', icon: Calendar, to: '/admin/hr/leave' },
      { key: 'attendance', label: 'Attendance', icon: Clock, to: '/admin/hr/attendance' },
      { key: 'recruitment', label: 'Recruitment', icon: GraduationCap, to: '/admin/hr/recruitment' },
      { key: 'performance', label: 'Performance', icon: Star, to: '/admin/hr/performance' },
      { key: 'disciplinary', label: 'Disciplinary', icon: Scale, to: '/admin/hr/disciplinary' },
      { key: 'staff', label: 'User Accounts', icon: UserCircle, to: '/admin/staff' },
    ]
  }
  if (isSupervisor.value) {
    return [
      { key: 'my-team', label: 'My Team', icon: Users, to: '/admin/hr/my-team' },
      { key: 'team-leave', label: 'Team Leave', icon: Calendar, to: '/admin/hr/team-leave' },
      { key: 'team-perf', label: 'Team Perf.', icon: Star, to: '/admin/hr/team-performance' },
    ]
  }
  if (isEmployee.value) {
    return [
      { key: 'my-leave', label: 'My Leave', icon: Calendar, to: '/admin/hr/my-leave' },
      { key: 'my-attendance', label: 'My Attendance', icon: Clock, to: '/admin/hr/my-attendance' },
      { key: 'my-perf', label: 'My Perf.', icon: Star, to: '/admin/hr/my-performance' },
    ]
  }
  return []
})

// ── Health links for top navbar ──
const healthLinks = computed(() => {
  if (!isAdmin.value && !isFacilityHealth.value) return []
  return [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/health/dashboard' },
    { key: 'inventory', label: 'Inventory', icon: Package, to: '/health/inventory' },
    { key: 'patients', label: 'Patients', icon: Users, to: '/health/patients' },
    { key: 'visits', label: 'Visits', icon: Stethoscope, to: '/health/visits' },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone, to: '/health/campaigns' },
    { key: 'reports', label: 'Reports', icon: BarChart, to: '/health/reports' },
  ]
})

// ── Community Health links for top navbar ──
const communityHealthLinks = computed(() => {
  if (!isAdmin.value && !isCommunityHealthOfficer.value) return []
  return [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/community-health/dashboard' },
    { key: 'units', label: 'Units', icon: TreePine, to: '/community-health/units' },
    { key: 'assistants', label: 'Assistants', icon: Users, to: '/community-health/assistants' },
    { key: 'volunteers', label: 'Volunteers', icon: Activity, to: '/community-health/volunteers' },
    { key: 'households', label: 'Households', icon: Home, to: '/community-health/households' },
    { key: 'visits', label: 'Visits', icon: Clipboard, to: '/community-health/visits' },
    { key: 'dialogues', label: 'Dialogues', icon: CalendarCheck, to: '/community-health/dialogues' },
    { key: 'action-days', label: 'Action Days', icon: Calendar, to: '/community-health/action-days' },
    { key: 'supplies', label: 'Supplies', icon: Truck, to: '/community-health/supplies' },
    { key: 'reports', label: 'Reports', icon: BarChart, to: '/community-health/reports' },
  ]
})

// ── CHV links for top navbar ──
const chvLinks = computed(() => {
  if (!isAdmin.value && !isChv.value) return []
  return [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/chv/dashboard' },
    { key: 'households', label: 'Households', icon: Home, to: '/chv/households' },
    { key: 'visits', label: 'Visits', icon: Clipboard, to: '/chv/visits' },
    { key: 'supplies', label: 'Supplies', icon: Truck, to: '/chv/supplies' },
  ]
})

// ── Active module links for top navbar ──
const activeModuleLinks = computed(() => {
  switch (activeModuleKey.value) {
    case 'website': return websiteContentLinks.value
    case 'revenue': return revenueLinks.value
    case 'hcm': return hcmLinks.value
    case 'health': return healthLinks.value
    case 'community-health': return communityHealthLinks.value
    case 'chv': return chvLinks.value
    // Default to website content links (Dashboard, or any unmatched path)
    default: return websiteContentLinks.value
  }
})

// ── Responsive link splitting ──
// Show first N links inline, rest in a "More" dropdown
const DESKTOP_VISIBLE = 6
const MOBILE_VISIBLE = 3

const desktopVisibleLinks = computed(() => activeModuleLinks.value.slice(0, DESKTOP_VISIBLE))
const desktopOverflowLinks = computed(() => activeModuleLinks.value.slice(DESKTOP_VISIBLE))

const mobileVisibleLinks = computed(() => activeModuleLinks.value.slice(0, MOBILE_VISIBLE))
const mobileOverflowLinks = computed(() => activeModuleLinks.value.slice(MOBILE_VISIBLE))

// ── Dropdown toggle state (desktop & mobile) ──
const desktopDropdownOpen = ref(false)
const mobileDropdownOpen = ref(false)
const contentDropdownOpen = ref(false)

function toggleDesktopDropdown() {
  desktopDropdownOpen.value = !desktopDropdownOpen.value
}

function closeDesktopDropdown() {
  desktopDropdownOpen.value = false
}

function toggleMobileDropdown() {
  mobileDropdownOpen.value = !mobileDropdownOpen.value
}

function closeMobileDropdown() {
  mobileDropdownOpen.value = false
}

function toggleContentDropdown() {
  contentDropdownOpen.value = !contentDropdownOpen.value
}

function closeContentDropdown() {
  contentDropdownOpen.value = false
}

// ── Close dropdowns on outside click ──
function handleClickOutside(e) {
  // Only close if the click is outside the navbar and subnav area
  const navbar = document.querySelector('.navbar')
  const subnav = document.querySelector('.subnav')
  const isInside = (navbar && navbar.contains(e.target)) || (subnav && subnav.contains(e.target))
  if (!isInside) {
    desktopDropdownOpen.value = false
    mobileDropdownOpen.value = false
    contentDropdownOpen.value = false
  }
}

// ── Module definitions ────────────────────────────────────────
// Returns grouped items with children arrays for collapsible sidebar sections.
// Flat items (Dashboard, Modules, Settings) have no children.
const modules = computed(() => {
  const items = []

  // Dashboard – always visible (flat link)
  items.push({
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    visible: true,
  })

  // ── Content Management (collapsible group) ──
  const contentMgmtVisible = isAdmin.value || isCommunicationEditor.value || userRole.value === 'editor'
  if (contentMgmtVisible) {
    const children = [
      { key: 'allContent', label: 'All Content', icon: FileText, to: '/cms/content' },
      { key: 'media', label: 'Media Library', icon: Image, to: '/cms/media' },
      { key: 'categories', label: 'Categories', icon: Tag, to: '/cms/categories' },
      { key: 'news', label: 'News', icon: Newspaper, to: '/website/news' },
      { key: 'events', label: 'Events', icon: CalendarDays, to: '/website/events' },
      { key: 'tenders', label: 'Tenders', icon: ScrollText, to: '/website/tenders' },
      { key: 'vacancies', label: 'Vacancies', icon: Briefcase, to: '/website/vacancies' },
      { key: 'departments', label: 'Departments', icon: Building2, to: '/website/departments' },
      { key: 'persons', label: 'Persons', icon: UserCircle, to: '/website/persons' },
      { key: 'facts', label: 'Facts', icon: Quote, to: '/website/facts' },
      { key: 'heroSlides', label: 'Hero Slides', icon: Images, to: '/website/hero-slides' },
    ]
    // Navigation Menus — admin only
    if (isAdmin.value) {
      children.push({ key: 'menus', label: 'Navigation Menus', icon: Menu, to: '/cms/menus' })
    }
    items.push({
      key: 'contentManagement',
      label: 'Content Management',
      icon: Globe,
      to: '/website/news',
      visible: true,
      children,
    })
  }

  // ── Revenue (collapsible group) ──
  const revVisible = isAdmin.value || isRevenue.value
  if (revVisible) {
    items.push({
      key: 'revenue',
      label: 'Revenue',
      icon: DollarSign,
      to: '/admin/permits',
      visible: true,
      children: [
        { key: 'permits', label: 'Permits', icon: FileCheck, to: '/admin/permits' },
        { key: 'assignments', label: 'Assignments', icon: ClipboardList, to: '/admin/permits/assign' },
        { key: 'reports', label: 'Reports', icon: BarChart, to: '/admin/permits/reports' },
      ],
    })
  }

  // ── Human Capital Management (collapsible group, role-based children) ──
  const hcmVisible =
    isAdmin.value || isHrOfficer.value || isSupervisor.value || isEmployee.value
  if (hcmVisible) {
    const children = []
    // Admin / HR Officer view
    if (isAdmin.value || isHrOfficer.value) {
      children.push(
        { key: 'employees', label: 'Employees', icon: Users, to: '/admin/hr/employees' },
        { key: 'leave', label: 'Leave', icon: Calendar, to: '/admin/hr/leave' },
        { key: 'attendance', label: 'Attendance', icon: Clock, to: '/admin/hr/attendance' },
        { key: 'recruitment', label: 'Recruitment', icon: GraduationCap, to: '/admin/hr/recruitment' },
        { key: 'vacancy-requests', label: 'Vacancy Requests', icon: FileText, to: '/admin/hr/vacancy-requests' },
        { key: 'shortlist', label: 'Shortlisting', icon: ClipboardCheck, to: '/admin/hr/shortlist' },
        { key: 'interview-panels', label: 'Interview Panels', icon: Users, to: '/admin/hr/interview-panels' },
        { key: 'appointment-letters', label: 'Appointment Letters', icon: Mail, to: '/admin/hr/appointment-letters' },
        { key: 'performance', label: 'Performance', icon: Star, to: '/admin/hr/performance' },
        { key: 'disciplinary', label: 'Disciplinary', icon: Scale, to: '/admin/hr/disciplinary' },
        { key: 'reports', label: 'Reports', icon: BarChart, to: '/admin/hr/reports' },
        { key: 'staff', label: 'User Accounts', icon: UserCircle, to: '/admin/staff' },
      )
    }
    // Supervisor view
    if (isSupervisor.value) {
      children.push(
        { key: 'my-team', label: 'My Team', icon: Users, to: '/admin/hr/my-team' },
        { key: 'team-leave', label: 'Team Leave', icon: Calendar, to: '/admin/hr/team-leave' },
        { key: 'team-perf', label: 'Team Perf.', icon: Star, to: '/admin/hr/team-performance' },
      )
    }
    // Employee view
    if (isEmployee.value) {
      children.push(
        { key: 'my-leave', label: 'My Leave', icon: Calendar, to: '/admin/hr/my-leave' },
        { key: 'my-attendance', label: 'My Attendance', icon: Clock, to: '/admin/hr/my-attendance' },
        { key: 'my-perf', label: 'My Perf.', icon: Star, to: '/admin/hr/my-performance' },
      )
    }
    items.push({
      key: 'hcm',
      label: 'Human Capital Management',
      icon: Users,
      to: '/admin/hr/employees',
      visible: true,
      children,
    })
  }

  // ── Health (collapsible group) ──
  const healthVisible = isAdmin.value || isHealth.value
  if (healthVisible) {
    items.push({
      key: 'health',
      label: 'Health',
      icon: Heart,
      to: '/health/dashboard',
      visible: true,
      children: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/health/dashboard' },
        { key: 'inventory', label: 'Inventory', icon: Package, to: '/health/inventory' },
        { key: 'patients', label: 'Patients', icon: Users, to: '/health/patients' },
        { key: 'visits', label: 'Visits', icon: Stethoscope, to: '/health/visits' },
        { key: 'campaigns', label: 'Campaigns', icon: Megaphone, to: '/health/campaigns' },
        { key: 'reports', label: 'Reports', icon: BarChart, to: '/health/reports' },
      ],
    })
  }

  // ── Admin-only flat links ──
  if (isAdmin.value) {
    items.push({
      key: 'modules',
      label: 'Modules',
      icon: Puzzle,
      to: '/admin/modules',
      visible: true,
    })
    items.push({
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      to: '/admin/settings',
      visible: true,
    })
  }

  return items
})

// ── Pinned module items (filtered from full modules list) ──
const pinnedModuleItems = computed(() =>
  modules.value.filter((m) => pinnedModules.value.includes(m.key))
)

// ── Non-pinned module items (for the main list) ──
const unpinnedModules = computed(() =>
  modules.value.filter((m) => !pinnedModules.value.includes(m.key))
)

// ── Restore theme from localStorage on mount ──
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    document.querySelector('html').setAttribute('data-theme', savedTheme)
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ── (removed buildHcmChildren, buildHealthChildren, buildContentMgmtChildren) ──
</script>

<template>
  <div class="drawer md:drawer-open">
    <!-- Drawer toggle for mobile -->
    <input id="app-drawer" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />

    <!-- Main content area -->
    <div class="drawer-content flex flex-col min-h-screen">
      <!-- ── Top Navbar (White, Slack-style) ── -->
      <nav class="navbar bg-base-100 border-b border-base-300 text-base-content sticky top-0 z-30 min-h-[56px] shadow-sm" aria-label="Main navigation">
        <!-- Left: Hamburger (mobile) + Logo -->
        <div class="flex-none md:hidden">
          <label for="app-drawer" class="btn btn-square btn-ghost text-base-content hover:bg-base-300" aria-label="Open sidebar menu">
            <Menu class="w-5 h-5" aria-hidden="true" />
          </label>
        </div>

        <!-- Logo (desktop) -->
        <div class="flex-none hidden md:flex items-center gap-2 px-2 mr-2">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-sm font-bold text-primary">WP</span>
          </div>
          <span class="text-sm font-semibold text-base-content/80 hidden xl:inline">West Pokot</span>
        </div>

        <!-- SearchBar (Facebook-style) -->
        <SearchBar
          v-model="searchOpen"
          placeholder="Search content, people, menus..."
          @search="handleSearch"
          @submit="handleSearchSubmit"
        />

        <!-- Center: SearchBar (spacer) -->
        <div class="flex-1"></div>

        <!-- Right: Dark mode toggle + Notifications + User avatar (Facebook-style) -->
        <div class="flex-none flex items-center gap-1">
          <!-- Dark mode toggle -->
          <button class="nav-icon-btn btn btn-square btn-ghost w-10 h-10 p-1.5" @click="toggleDarkMode" aria-label="Toggle dark mode">
            <Moon class="w-4.5 h-4.5" aria-hidden="true" />
          </button>

          <!-- Notification bell (Facebook-style) -->
          <NotificationDropdown />

          <!-- User avatar with online indicator (Facebook-style) -->
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="nav-icon-btn btn btn-ghost btn-circle avatar placeholder w-10 h-10" aria-label="User menu" aria-haspopup="true">
              <div class="relative">
                <div class="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  {{ authStore.userName?.charAt(0) || 'U' }}
                </div>
                <!-- Online indicator dot -->
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-base-100 rounded-full" aria-hidden="true"></span>
              </div>
            </label>
            <ul tabindex="0" class="mt-2 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-lg w-52 border border-base-300" role="menu">
              <li class="menu-title text-base-content/60" role="none">
                <span role="menuitem" aria-disabled="true" class="text-base-content font-semibold">{{ authStore.userName }}</span>
              </li>
              <li class="menu-title text-base-content/50" role="none">
                <span class="badge badge-sm badge-primary text-white" role="menuitem" aria-disabled="true">{{ authStore.userRole }}</span>
              </li>
              <li role="none"><hr class="my-1 border-base-200" aria-hidden="true" /></li>
              <li role="none">
                <a role="menuitem" @click="handleLogout" class="flex items-center gap-2 text-base-content/70 hover:text-error hover:bg-error/5 rounded-md px-2 py-1.5 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- ── Subnav: Module-Specific Links ── -->
      <nav v-if="activeModuleLinks.length > 0" class="subnav bg-base-100 border-b border-base-300 rounded-b-xl shadow-sm mx-2">
        <div class="max-w-7xl mx-auto px-4">
          <!-- Scroll wrapper: overflow-x on this div for horizontal scroll -->
          <!-- IMPORTANT: overflow-x:auto coerces overflow-y to auto, so dropdowns must be
               placed OUTSIDE this wrapper to avoid being clipped -->
          <div class="subnav-scroll flex items-center gap-0.5 overflow-x-auto py-0 scrollbar-hide">
            <ul class="flex items-center gap-0.5">
              <!-- Desktop: inline links -->
              <li v-for="link in desktopVisibleLinks" :key="link.key" class="shrink-0 hidden md:block">
                <router-link
                  :to="link.to"
                  class="subnav-link"
                  :class="{ 'subnav-link--active': route.path.startsWith(link.to) }"
                >
                  <component :is="link.icon" class="w-4 h-4" aria-hidden="true" />
                  <span>{{ link.label }}</span>
                </router-link>
              </li>

              <!-- Mobile: scrollable links (first N visible, rest in dropdown) -->
              <li v-for="link in mobileVisibleLinks" :key="link.key" class="shrink-0 md:hidden">
                <router-link
                  :to="link.to"
                  class="subnav-link"
                  :class="{ 'subnav-link--active': route.path.startsWith(link.to) }"
                >
                  <component :is="link.icon" class="w-4 h-4" aria-hidden="true" />
                  <span>{{ link.label }}</span>
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Desktop "More" dropdown — OUTSIDE the overflow wrapper so it's never clipped -->
          <div v-if="desktopOverflowLinks.length > 0" class="hidden md:inline-block relative">
            <button
              class="subnav-link"
              @click.stop="toggleDesktopDropdown"
              @keydown.escape="closeDesktopDropdown"
              aria-haspopup="true"
              :aria-expanded="desktopDropdownOpen"
            >
              <span>More</span>
              <ChevronDown class="w-3 h-3" aria-hidden="true" />
            </button>
            <ul
              v-show="desktopDropdownOpen"
              class="absolute left-0 top-full mt-1 z-[100] menu menu-sm p-2 shadow-lg bg-base-200 rounded-lg w-52 border border-base-300"
              role="menu"
            >
              <li v-for="link in desktopOverflowLinks" :key="link.key" role="none">
                <router-link
                  :to="link.to"
                  class="flex items-center gap-2 text-base-content hover:text-primary hover:bg-primary/5 rounded-md px-2 py-1.5"
                  :class="{ 'text-primary font-semibold': route.path.startsWith(link.to) }"
                  role="menuitem"
                  @click="closeDesktopDropdown"
                >
                  <component :is="link.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span class="text-xs">{{ link.label }}</span>
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Mobile "More" dropdown — OUTSIDE the overflow wrapper so it's never clipped -->
          <div v-if="mobileOverflowLinks.length > 0" class="inline-block md:hidden relative">
            <button
              class="subnav-link"
              @click.stop="toggleMobileDropdown"
              @keydown.escape="closeMobileDropdown"
              aria-haspopup="true"
              :aria-expanded="mobileDropdownOpen"
            >
              <span>More</span>
              <ChevronDown class="w-3 h-3" aria-hidden="true" />
            </button>
            <ul
              v-show="mobileDropdownOpen"
              class="absolute left-0 top-full mt-1 z-[100] menu menu-sm p-2 shadow-lg bg-base-200 rounded-lg w-48 border border-base-300"
              role="menu"
            >
              <li v-for="link in mobileOverflowLinks" :key="link.key" role="none">
                <router-link
                  :to="link.to"
                  class="flex items-center gap-2 text-base-content hover:text-primary hover:bg-primary/5 rounded-md px-2 py-1.5"
                  :class="{ 'text-primary font-semibold': route.path.startsWith(link.to) }"
                  role="menuitem"
                  @click="closeMobileDropdown"
                >
                  <component :is="link.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span class="text-xs">{{ link.label }}</span>
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- ── Breadcrumb bar (Facebook-style: subtle, below subnav) ── -->
      <div v-if="breadcrumbs.length > 1" class="bg-base-200/30 border border-base-300 rounded-lg mx-2 my-1 px-4 lg:px-6 py-1.5">
        <div class="max-w-7xl mx-auto">
          <div class="breadcrumbs text-xs text-base-content/60">
            <ul>
              <li v-for="(crumb, idx) in breadcrumbs" :key="idx">
                <router-link
                  v-if="crumb.to"
                  :to="crumb.to"
                  class="hover:text-primary transition-colors"
                >
                  {{ crumb.label }}
                </router-link>
                <span v-else class="text-base-content font-medium">{{ crumb.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ── Page content area ── -->
      <main class="flex-1 bg-base-200 pb-16 md:pb-0 px-2">
        <div class="max-w-7xl mx-auto bg-base-100 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] border border-base-200/80 border-t-2 border-t-primary/20 p-4 lg:p-6">
          <router-view v-slot="{ Component }">
            <transition name="content-fade" mode="out-in">
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- ── Facebook-Style Sidebar ── -->
    <div class="drawer-side z-40">
      <label for="app-drawer" class="drawer-overlay"></label>
      <aside class="bg-neutral text-neutral-content min-h-full w-64 md:w-56 lg:w-64 border-r border-neutral/10 flex flex-col shadow-sm rounded-r-xl">
        <!-- Sidebar header (Apple-style: compact logo + branding) -->
        <div class="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span class="text-sm font-bold text-white">WP</span>
          </div>
          <div class="flex flex-col">
            <h2 class="text-sm font-bold text-neutral-content leading-tight">West Pokot</h2>
            <p class="text-[10px] text-neutral-content/60 leading-tight">County ERP System</p>
          </div>
        </div>

        <!-- Navigation menu (Facebook-style: compact, icon+label) -->
        <div class="flex-1 overflow-y-auto py-2">
          <!-- ── Shortcuts section (pinned modules) ── -->
          <div v-if="pinnedModuleItems.length > 0" class="mb-2 mx-2 bg-white/5 rounded-lg p-1">
            <button
              class="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-neutral-content/60 uppercase tracking-wider hover:text-neutral-content transition-colors"
              @click="toggleSidebarSection('shortcuts')"
              :aria-expanded="sidebarSections.shortcuts"
              aria-controls="sidebar-section-shortcuts"
            >
              <span>Shortcuts</span>
              <ChevronRight
                class="w-3 h-3 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.shortcuts }"
                aria-hidden="true"
              />
            </button>
            <ul
              id="sidebar-section-shortcuts"
              v-show="sidebarSections.shortcuts"
              class="menu menu-sm p-1 gap-0.5"
            >
              <li v-for="mod in pinnedModuleItems" :key="mod.key">
                <router-link
                  :to="mod.to"
                  class="sidebar-link flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-content/80 rounded-md"
                  :class="{ active: route.path.startsWith(mod.to) }"
                  @click="drawerOpen = false"
                >
                  <component :is="mod.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span class="flex-1">{{ mod.label }}</span>
                  <button
                    class="opacity-0 group-hover:opacity-100 hover:text-amber-400 transition-opacity"
                    @click.stop="togglePin(mod.key)"
                    :aria-label="`Unpin ${mod.label}`"
                    title="Unpin shortcut"
                  >
                    <Pin class="w-3 h-3 fill-primary text-primary" aria-hidden="true" />
                  </button>
                </router-link>
              </li>
            </ul>
            <div class="border-t border-white/10 my-1 mx-3"></div>
          </div>

          <!-- ── All Modules section ── -->
          <div class="mx-2 bg-white/5 rounded-lg p-1">
            <button
              class="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-neutral-content/60 uppercase tracking-wider hover:text-neutral-content transition-colors"
              @click="toggleSidebarSection('modules')"
              :aria-expanded="sidebarSections.modules"
              aria-controls="sidebar-section-modules"
            >
              <span>Modules</span>
              <ChevronRight
                class="w-3 h-3 transition-transform duration-200"
                :class="{ 'rotate-90': sidebarSections.modules }"
                aria-hidden="true"
              />
            </button>
            <ul
              id="sidebar-section-modules"
              v-show="sidebarSections.modules"
              class="menu menu-sm p-1 gap-0.5"
            >
              <li
                v-for="mod in unpinnedModules"
                :key="mod.key"
                v-show="mod.visible !== false"
                class="group"
              >
                <!-- All sidebar items are flat links (no collapsible groups) -->
                <router-link
                  :to="mod.to"
                  class="sidebar-link flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-content/80 rounded-md"
                  :class="{ active: route.path.startsWith(mod.to) }"
                  @click="drawerOpen = false"
                >
                  <component :is="mod.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span class="flex-1">{{ mod.label }}</span>
                  <button
                    class="opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-opacity"
                    @click.stop="togglePin(mod.key)"
                    :aria-label="`Pin ${mod.label} to shortcuts`"
                    title="Pin to shortcuts"
                  >
                    <Pin class="w-3 h-3" aria-hidden="true" />
                  </button>
                </router-link>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar footer -->
        <div class="px-4 py-3 border-t border-white/10 shrink-0">
          <p class="text-[10px] text-neutral-content/60">© 2024 West Pokot County</p>
        </div>
      </aside>
    </div>
  </div>

  <!-- Global toast notifications -->
  <ToastContainer />

  <!-- Mobile bottom navigation (visible only on small screens) -->
  <MobileBottomNav />
</template>

<style scoped>
/* ── Subnav link base ─────────────────────────────── */
.subnav-link {
  @apply flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap;
  color: theme('colors.base-content');
}
.subnav-link:hover {
  background: theme('colors.base-300');
}
.subnav-link:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
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

/* ── Horizontal scroll container ──────────────────── */
.subnav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.subnav-scroll::-webkit-scrollbar {
  display: none;
}
/* Reserve scrollbar space */
aside {
  scrollbar-gutter: stable;
}
aside::-webkit-scrollbar {
  width: 6px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
aside::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}
</style>
