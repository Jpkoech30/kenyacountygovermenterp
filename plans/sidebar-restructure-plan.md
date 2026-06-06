# Sidebar Restructure + User Journey Fix Plan

## Audit: 9 Breaking Issues Found

### Revenue Module
| # | Issue | Detail |
|---|-------|--------|
| 1 | Missing route | `/admin/permits/reports` — top subnav links to it but no route exists → 404 |

### HCM Module
| # | Issue | Detail |
|---|-------|--------|
| 2 | Missing route | `/admin/hr/disciplinary` — top subnav links to it but no route exists → 404 |
| 3 | Missing route | `/admin/hr/my-attendance` — employee top subnav links to it → 404 |
| 4 | Missing route | `/admin/hr/my-leave` — employee top subnav links to it → 404 |
| 5 | Missing route | `/admin/hr/my-performance` — employee top subnav links to it → 404 |
| 6 | Missing route | `/admin/hr/team-leave` — supervisor top subnav links to it → 404 |
| 7 | Missing route | `/admin/hr/team-performance` — supervisor top subnav links to it → 404 |
| 8 | Missing route | `/admin/hr/my-team` — supervisor top subnav links to it → 404 |

### All Modules
| # | Issue | Detail |
|---|-------|--------|
| 9 | Sidebar missing sub-items | CMS, Revenue, HCM, Health only show parent links. Sub-pages only accessible via top subnav dropdown. |

---

## Proposed Changes

### Change 1: Add 8 Missing Routes in `frontend/src/router/index.js`

**Revenue:**
- `/admin/permits/reports` → reuse existing `ReportsPage.vue` or create a dedicated revenue reports page

**HCM (employee self-service):**
- `/admin/hr/my-attendance` → reuse `AttendancePage.vue` with employee filter
- `/admin/hr/my-leave` → reuse `LeavePage.vue` with employee filter
- `/admin/hr/my-performance` → reuse `PerformancePage.vue` with employee filter

**HCM (supervisor):**
- `/admin/hr/my-team` → new page or reuse `EmployeeListPage.vue` with team filter
- `/admin/hr/team-leave` → reuse `LeavePage.vue` with team filter
- `/admin/hr/team-performance` → reuse `PerformancePage.vue` with team filter

**HCM (disciplinary):**
- `/admin/hr/disciplinary` → reuse existing `DisciplinaryPage.vue` (check if it exists)

### Change 2: Restructure Sidebar in `AdminLayout.vue`

**`modules` computed** — return grouped items with `children` arrays:

```js
// Dashboard — flat link (always visible)
{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', visible: true }

// Content Management — collapsible group
{
  key: 'contentManagement', label: 'Content Management', icon: Globe,
  to: '/website/news', visible: isAdmin || isCommunicationEditor || isEditor,
  children: [
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
    { key: 'menus', label: 'Navigation Menus', icon: Menu, to: '/cms/menus', visible: isAdmin },
  ]
}

// Revenue — collapsible group
{
  key: 'revenue', label: 'Revenue', icon: DollarSign,
  to: '/admin/permits', visible: isAdmin || isRevenue,
  children: [
    { key: 'permits', label: 'Permits', icon: FileCheck, to: '/admin/permits' },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList, to: '/admin/permits/assign' },
    { key: 'reports', label: 'Reports', icon: BarChart, to: '/admin/permits/reports' },
  ]
}

// Human Capital Management — collapsible group
{
  key: 'hcm', label: 'Human Capital Management', icon: Users,
  to: '/admin/hr/employees', visible: isAdmin || isHrOfficer || isSupervisor || isEmployee,
  children: [
    // Admin/HR Officer view
    ...(isAdmin || isHrOfficer ? [
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
      { key: 'staff', label: 'Staff Directory', icon: UserCircle, to: '/admin/staff' },
    ] : []),
    // Supervisor view
    ...(isSupervisor ? [
      { key: 'my-team', label: 'My Team', icon: Users, to: '/admin/hr/my-team' },
      { key: 'team-leave', label: 'Team Leave', icon: Calendar, to: '/admin/hr/team-leave' },
      { key: 'team-perf', label: 'Team Perf.', icon: Star, to: '/admin/hr/team-performance' },
    ] : []),
    // Employee view
    ...(isEmployee ? [
      { key: 'my-leave', label: 'My Leave', icon: Calendar, to: '/admin/hr/my-leave' },
      { key: 'my-attendance', label: 'My Attendance', icon: Clock, to: '/admin/hr/my-attendance' },
      { key: 'my-perf', label: 'My Perf.', icon: Star, to: '/admin/hr/my-performance' },
    ] : []),
  ]
}

// Health — collapsible group
{
  key: 'health', label: 'Health', icon: Heart,
  to: '/health/dashboard', visible: isAdmin || isHealth,
  children: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/health/dashboard' },
    { key: 'inventory', label: 'Inventory', icon: Package, to: '/health/inventory' },
    { key: 'patients', label: 'Patients', icon: Users, to: '/health/patients' },
    { key: 'visits', label: 'Visits', icon: Stethoscope, to: '/health/visits' },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone, to: '/health/campaigns' },
    { key: 'reports', label: 'Reports', icon: BarChart, to: '/health/reports' },
  ]
}

// Modules — flat link (admin only)
{ key: 'modules', label: 'Modules', icon: Puzzle, to: '/admin/modules', visible: isAdmin }

// Settings — flat link (admin only)
{ key: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings', visible: isAdmin }
```

**Sidebar template** — replace flat `<li>` loop with grouped renderer:

```html
<li v-for="mod in unpinnedModules" :key="mod.key" v-show="mod.visible !== false">
  <!-- Collapsible group -->
  <details v-if="mod.children && mod.children.length > 0" :open="isGroupOpen(mod)">
    <summary class="sidebar-link flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer">
      <component :is="mod.icon" class="w-4 h-4 shrink-0" />
      <span class="flex-1">{{ mod.label }}</span>
      <ChevronDown class="w-3 h-3 transition-transform" />
    </summary>
    <ul class="ml-2 border-l border-white/10 pl-2 mt-0.5 space-y-0.5">
      <li v-for="child in mod.children" :key="child.key" v-show="child.visible !== false">
        <router-link
          :to="child.to"
          class="sidebar-link flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md"
          :class="{ active: route.path.startsWith(child.to) }"
          @click="drawerOpen = false"
        >
          <component :is="child.icon" class="w-4 h-4 shrink-0" />
          <span>{{ child.label }}</span>
        </router-link>
      </li>
    </ul>
  </details>
  <!-- Flat link (Dashboard, Modules, Settings) -->
  <router-link v-else :to="mod.to" class="sidebar-link flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md"
    :class="{ active: route.path.startsWith(mod.to) }" @click="drawerOpen = false">
    <component :is="mod.icon" class="w-4 h-4 shrink-0" />
    <span class="flex-1">{{ mod.label }}</span>
    <button class="opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-opacity"
      @click.stop="togglePin(mod.key)" title="Pin to shortcuts">
      <Pin class="w-3 h-3" />
    </button>
  </router-link>
</li>
```

**`isGroupOpen` helper** — auto-expand group if any child route is active:

```js
function isGroupOpen(mod) {
  if (!mod.children) return false
  return mod.children.some(child => route.path.startsWith(child.to))
}
```

**`pinnedModuleItems`** — update to handle groups (pinning a group pins the parent key):

```js
const pinnedModuleItems = computed(() =>
  modules.value.filter((m) => pinnedModules.value.includes(m.key))
)
```

### Change 3: Remove Duplicate Staff Directory

Delete lines 514-521 in `AdminLayout.vue` (Staff Directory under Content Management). Keep only under HCM.

---

## AI Enhancements for User Flow

The app already has a DeepSeek integration via [`llmService.js`](backend/src/services/llmService.js) with:
- Text summarization in 3 languages (English, Kiswahili, Pokot)
- Cost tracking in KES
- Rate limiting
- Configurable via Settings (API key, model, max tokens)

The planned AI Content Assistant (see [`plans/ai-content-assistant-plan.md`](plans/ai-content-assistant-plan.md)) adds:
- URL scraping → AI-generated draft content
- File upload → AI-generated draft content
- Multi-language support

**AI enhancements to add alongside sidebar restructure:**

1. **Smart sidebar search** — Add an AI-powered search bar at the top of the sidebar that uses the existing LLM to help users find the right page. When a user types a natural language query (e.g., "where do I approve leave requests?"), it searches module labels, child labels, and route names.

2. **AI shortcut suggestions** — Use the existing LLM to analyze the user's role and recent activity, then suggest pinned shortcuts. Store suggestions in localStorage and show a "Suggested for you" section above pinned items.

3. **Context-aware help tooltip** — When hovering over any sidebar item, show a brief AI-generated description of what that page does (e.g., "Manage employee leave requests, approvals, and balances"). These descriptions can be pre-generated and stored as `description` field on each module/child item.

---

## Acceptance Criteria

- [ ] 8 missing routes added — no more 404s from top subnav links
- [ ] Sidebar shows 4 collapsible groups: Content Management, Revenue, HCM, Health
- [ ] Each group expands/collapses independently via `<details>`/`<summary>`
- [ ] A group auto-opens if any child route is active
- [ ] Staff Directory appears only once (under HCM)
- [ ] Recruitment Extension items nested under HCM group
- [ ] Dashboard, Modules, Settings remain as flat top-level links
- [ ] Pin/unpin works for groups (pins the parent group)
- [ ] Mobile drawer works correctly with grouped items
- [ ] Role-based visibility preserved (admin sees all, employee sees only their items)
- [ ] Frontend build passes with 0 errors
