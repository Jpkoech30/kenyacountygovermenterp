# Plan: Dynamic Top Navbar Links Based on Active Sidebar Module

## Goal
The top navbar should dynamically show inline links for the currently active sidebar module, rather than always showing only the Website Content links. When a user clicks a sidebar module (e.g., Revenue, HCM, Health), the top navbar updates to show that module's sub-items as compact icon+label links.

## Current State
- **Top navbar**: Always shows 8 Website Content links (News, Events, Tenders, Vacancies, Departments, Persons, Facts, Hero Slides) when user has content editor role
- **Sidebar**: Has collapsible dropdown modules: Dashboard, Content Management, Revenue, HCM, Health, Modules, Settings
- Each sidebar module has its own set of children/links

## Proposed Solution

### 1. Define link definitions for each module
Create a mapping of module key → array of link objects (icon, label, to path). This mirrors the existing `websiteContentLinks` computed property pattern.

### 2. Detect active module via route path
Create a computed `activeModuleKey` that checks `route.path` against known module path prefixes:
- `/website/*` or `/cms/*` → `'website'`
- `/admin/permits*` → `'revenue'`
- `/admin/hr/*` → `'hcm'`
- `/health/*` or `/community-health/*` or `/chv/*` → `'health'`
- `/` → `'dashboard'`
- `/admin/modules` → `'modules'`
- `/admin/settings` → `'settings'`

### 3. Create `activeModuleLinks` computed
Returns the link array for the currently active module key. Falls back to website content links if no module is active.

### 4. Update top navbar template
Replace the hardcoded `websiteContentLinks` with `activeModuleLinks`. Keep the same compact `btn-xs` style with horizontal scroll.

## Module Link Definitions

### Website Content (8 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| news | News | Newspaper | /website/news |
| events | Events | CalendarDays | /website/events |
| tenders | Tenders | ScrollText | /website/tenders |
| vacancies | Vacancies | Briefcase | /website/vacancies |
| departments | Departments | Building2 | /website/departments |
| persons | Persons | UserCircle | /website/persons |
| facts | Facts | Quote | /website/facts |
| heroSlides | Hero Slides | Images | /website/hero-slides |

### Revenue (3 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| permits | Permits | FileCheck | /admin/permits |
| assignments | Assignments | ClipboardList | /admin/permits/assign |
| reports | Reports | BarChart | /admin/permits/reports |

### HCM - Admin/HR Officer (6 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| employees | Employees | Users | /admin/hr/employees |
| leave | Leave | Calendar | /admin/hr/leave |
| attendance | Attendance | Clock | /admin/hr/attendance |
| recruitment | Recruitment | GraduationCap | /admin/hr/recruitment |
| performance | Performance | Star | /admin/hr/performance |
| disciplinary | Disciplinary | Scale | /admin/hr/disciplinary |

### HCM - Supervisor (3 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| my-team | My Team | Users | /admin/hr/my-team |
| team-leave | Team Leave | Calendar | /admin/hr/team-leave |
| team-perf | Team Performance | Star | /admin/hr/team-performance |

### HCM - Employee (3 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| my-leave | My Leave | Calendar | /admin/hr/my-leave |
| my-attendance | My Attendance | Clock | /admin/hr/my-attendance |
| my-perf | My Performance | Star | /admin/hr/my-performance |

### Health - Facility (5 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| dashboard | Dashboard | LayoutDashboard | /health/dashboard |
| inventory | Inventory | Package | /health/inventory |
| patients | Patients | Users | /health/patients |
| visits | Visits | Stethoscope | /health/visits |
| campaigns | Campaigns | Megaphone | /health/campaigns |
| reports | Reports | BarChart | /health/reports |

### Health - Community Health (10 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| dashboard | Dashboard | LayoutDashboard | /community-health/dashboard |
| units | Units | TreePine | /community-health/units |
| assistants | Assistants | Users | /community-health/assistants |
| volunteers | Volunteers | Activity | /community-health/volunteers |
| households | Households | Home | /community-health/households |
| visits | Visits | Clipboard | /community-health/visits |
| dialogues | Dialogues | CalendarCheck | /community-health/dialogues |
| action-days | Action Days | Calendar | /community-health/action-days |
| supplies | Supplies | Truck | /community-health/supplies |
| reports | Reports | BarChart | /community-health/reports |

### Health - CHV (4 links)
| Key | Label | Icon | To |
|-----|-------|------|----|
| dashboard | Dashboard | LayoutDashboard | /chv/dashboard |
| households | My Households | Home | /chv/households |
| visits | My Visits | Clipboard | /chv/visits |
| supplies | CHV Supplies | Truck | /chv/supplies |

## Implementation Details

### Changes to `AdminLayout.vue`:

1. **Add new computed `activeModuleKey`**:
```js
const activeModuleKey = computed(() => {
  const path = route.path
  if (path.startsWith('/website') || path.startsWith('/cms')) return 'website'
  if (path.startsWith('/admin/permits')) return 'revenue'
  if (path.startsWith('/admin/hr')) return 'hcm'
  if (path.startsWith('/health')) return 'health'
  if (path.startsWith('/community-health')) return 'community-health'
  if (path.startsWith('/chv')) return 'chv'
  if (path === '/') return 'dashboard'
  return null
})
```

2. **Add computed `activeModuleLinks`** that returns links based on `activeModuleKey`:
```js
const activeModuleLinks = computed(() => {
  switch (activeModuleKey.value) {
    case 'website': return websiteContentLinks.value
    case 'revenue': return revenueLinks.value
    case 'hcm': return hcmLinks.value
    case 'health': return healthLinks.value
    case 'community-health': return communityHealthLinks.value
    case 'chv': return chvLinks.value
    default: return []
  }
})
```

3. **Add link definition computeds** for each module (revenueLinks, hcmLinks, healthLinks, etc.)

4. **Update template**: Replace `websiteContentLinks` with `activeModuleLinks` in the top navbar section

5. **Keep the same responsive styling**: `overflow-x-auto scrollbar-hide flex-nowrap`, `btn-xs`, icon+label

## Files to Modify
- `frontend/src/layouts/AdminLayout.vue` - Add new computed properties, update template

## Acceptance Criteria
- [ ] Clicking Revenue in sidebar shows Permits, Assignments, Reports in top navbar
- [ ] Clicking HCM in sidebar shows role-appropriate links in top navbar
- [ ] Clicking Health in sidebar shows role-appropriate links in top navbar
- [ ] Clicking Website Content links in sidebar shows the 8 content type links in top navbar
- [ ] Links in top navbar are compact (icon + label, btn-xs) with horizontal scroll on small screens
- [ ] Active link is highlighted with `btn-active` class
- [ ] Build succeeds with no errors
