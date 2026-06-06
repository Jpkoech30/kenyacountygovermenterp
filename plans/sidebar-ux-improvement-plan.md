# Sidebar UX Improvement Plan

## Problem
The sidebar dropdown for "Website Content" has 8 items (News, Events, Tenders, Vacancies, Departments, Persons, Facts, Hero Slides) causing cognitive overload. Additionally, "Website Content" and "Communication" sections overlap in purpose, creating confusion.

## Solution: Merge, Group, and Add Visual Cues

### 1. Merge "Website Content" into "Communication"
Combine both sections into a single **"Content Management"** section since they serve the same audience (communication editors, content managers, admins). This eliminates the confusing distinction between "Website Content" and "Communication".

### 2. Group into Sub-Sections with Category Titles
Within the merged section, use DaisyUI `menu-title` items to visually separate items into logical groups:

```
Content Management (icon: Globe)
├── Content Pages
│   ├── News
│   ├── Events
│   ├── Tenders
│   └── Vacancies
├── Site Configuration
│   ├── Departments
│   ├── Persons
│   ├── Facts
│   └── Hero Slides
├── Media & Taxonomies
│   ├── Media Library
│   └── Categories
└── All Content (admin only)
    └── Content Manager (full list with workflow)
```

### 3. Add Visual Cues (Badges)
- Show a small badge next to each item indicating the count of published/pending items
- Use color-coded badges: green for published, yellow for pending review, red for draft
- This makes the sidebar scannable at a glance

### 4. Keep the Collapsible Pattern
The `<details>` dropdown stays, but the internal structure uses `menu-title` dividers for visual grouping (same pattern already used in the Health section's `buildHealthChildren()`).

## Implementation Details

### File to modify: [`frontend/src/layouts/AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue)

#### Changes to `modules` computed property:

**Remove** the separate `websiteContent` and `communication` blocks.

**Add** a single merged `contentManagement` block:

```js
// ── Content Management (merged Website Content + Communication) ──
const contentMgmtVisible = isAdmin.value || isCommunicationEditor.value || userRole.value === 'editor'
if (contentMgmtVisible) {
  items.push({
    key: 'contentManagement',
    label: 'Content Management',
    icon: Globe,
    visible: true,
    children: buildContentMgmtChildren(),
  })
}
```

**Add** a new `buildContentMgmtChildren()` function:

```js
function buildContentMgmtChildren() {
  const children = []
  const isEditor = isAdmin.value || isCommunicationEditor.value || userRole.value === 'editor'

  // ── Content Pages ──
  if (isEditor) {
    children.push(
      { type: 'title', label: 'Content Pages' },
      { type: 'link', label: 'News', icon: Newspaper, to: '/website/news' },
      { type: 'link', label: 'Events', icon: CalendarDays, to: '/website/events' },
      { type: 'link', label: 'Tenders', icon: ScrollText, to: '/website/tenders' },
      { type: 'link', label: 'Vacancies', icon: Briefcase, to: '/website/vacancies' },
    )
  }

  // ── Site Configuration ──
  if (isEditor) {
    children.push(
      { type: 'title', label: 'Site Configuration' },
      { type: 'link', label: 'Departments', icon: Building2, to: '/website/departments' },
      { type: 'link', label: 'Persons', icon: UserCircle, to: '/website/persons' },
      { type: 'link', label: 'Facts', icon: Quote, to: '/website/facts' },
      { type: 'link', label: 'Hero Slides', icon: Images, to: '/website/hero-slides' },
    )
  }

  // ── Media & Taxonomies ──
  if (isAdmin.value || isCommunicationEditor.value) {
    children.push(
      { type: 'title', label: 'Media & Taxonomies' },
      { type: 'link', label: 'Media Library', icon: Image, to: '/cms/media' },
      { type: 'link', label: 'Categories', icon: Tag, to: '/cms/categories' },
    )
  }

  // ── All Content (admin only) ──
  if (isAdmin.value) {
    children.push(
      { type: 'title', label: 'Administration' },
      { type: 'link', label: 'All Content', icon: FileText, to: '/cms/content' },
    )
  }

  return children
}
```

#### Template changes needed:
The template already supports `type: 'title'` and `type: 'link'` patterns (used by the Health section). No template changes required — the existing `v-if="child.type === 'title'"` and `v-else` branches handle this correctly.

### ContentListPage: Update page heading for "All Content" route
The route `/cms/content` (Content Manager) should show "All Content" as the heading. The existing `pageTitle` computed already falls back to `'Content Manager'` when no `contentType` is set, which is fine.

## Visual Design

```
┌─────────────────────────────────────┐
│  ◉ Dashboard                        │
│  🌐 Content Management              │
│  ├─ Content Pages                   │ ← menu-title (gray, smaller)
│  │  ├ 📰 News                   3   │ ← badge with count
│  │  ├ 📅 Events                 1   │
│  │  ├ 📜 Tenders                0   │
│  │  └ 💼 Vacancies              2   │
│  ├─ Site Configuration              │ ← menu-title
│  │  ├ 🏛 Departments             5  │
│  │  ├ 👤 Persons                 4  │
│  │  ├ 💬 Facts                   2  │
│  │  └ 🖼 Hero Slides             3  │
│  ├─ Media & Taxonomies              │ ← menu-title
│  │  ├ 🖼 Media Library              │
│  │  └ 🏷 Categories                 │
│  └─ Administration                  │ ← menu-title
│     └ 📄 All Content                │
│  💰 Revenue                         │
│  👥 Human Capital Management        │
│  ❤️ Health                          │
└─────────────────────────────────────┘
```

## Acceptance Criteria
1. "Website Content" and "Communication" sections are merged into a single "Content Management" section
2. Items are grouped under category titles: "Content Pages", "Site Configuration", "Media & Taxonomies", "Administration"
3. The collapsible dropdown pattern is preserved
4. All existing routes remain functional
5. Role-based visibility is preserved (admins see all, editors see content pages + site config, communication editors also see media & taxonomies)
