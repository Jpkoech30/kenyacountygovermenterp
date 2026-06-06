# Admin Layout Redesign Plan

## Problem

The admin panel's module navigation links are crammed inside the blue top navbar (`bg-primary`). This causes:

1. **Cramped layout**: 10+ Content Management links + Revenue/HCM/Health links all squeezed into a single blue bar with tiny text (`text-xs`)
2. **Poor contrast**: White text on blue (`#0071E3`) with opacity (`rgba(255,255,255,0.85)`) is hard to read
3. **No visual hierarchy**: Module links, search, user menu, and dark mode toggle all compete in one row
4. **Both themes affected**: Light mode has white-on-blue issues; dark mode has blue-on-dark-blue issues

## Solution: Two-Tier Admin Header

Split the single blue navbar into a two-tier layout, mirroring the successful public layout pattern:

```
┌──────────────────────────────────────────────────────────┐
│  ☰  WP  West Pokot    [🔍 Search...]    🌙  🔔  👤 U  │  ← Top bar (bg-primary, blue)
├──────────────────────────────────────────────────────────┤
│  Dashboard  │  Content Management  │  Revenue  │  HCM  │  ← Subnav (bg-base-100, solid text)
│  Health  │  Community Health  │  CHV  │  Modules  │  ...│     horizontally scrollable
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  Dashboard > Content Management > News                  │  ← Breadcrumb bar
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│                                                          │
│  Page Content                                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Tier 1: Top Bar (Blue) — Brand + Utilities Only

- **Left**: Hamburger (mobile) + Logo "WP West Pokot"
- **Center**: SearchBar (existing, stays in blue bar)
- **Right**: Dark mode toggle + Notifications + User avatar dropdown
- **No module links** — these move to Tier 2

### Tier 2: Subnav — Module Navigation Links

- **Background**: `bg-base-100/95 backdrop-blur-md border-b border-base-300`
- **Content**: All module-level navigation links in a horizontally scrollable row
- **Link style**: Solid `base-content` color, `text-sm font-medium`, active state with primary color underline
- **Dropdown support**: Modules with many sub-items (like Content Management with 11+ links) get a dropdown
- **Responsive**: Scrollable on mobile, shows all links on desktop

### What Moves Where

| Current Location | New Location |
|---|---|
| Module quick-action links (in blue bar, lines 626-770) | Subnav (new Tier 2) |
| Website Content Management links (11 items) | Subnav with "Content" dropdown trigger |
| Revenue links (3 items) | Subnav inline |
| HCM links (6 items) | Subnav inline |
| Health links (6 items) | Subnav inline |
| Community Health links (10 items) | Subnav with "More" dropdown |
| CHV links (4 items) | Subnav inline |
| Breadcrumb bar (line 813) | Stays below subnav |

## Files to Modify

| File | Changes |
|------|---------|
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue) | Remove module links from blue navbar (lines 625-770); add new subnav section between navbar and breadcrumb |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue) | Add scoped CSS for subnav links (similar to AppHeader.vue pattern) |

## Detailed Code Changes

### 1. Remove module links from blue navbar

Delete lines 625-770 (the entire `flex-1` div containing module quick-action links). The blue navbar becomes:

```html
<nav class="navbar bg-primary text-primary-content sticky top-0 z-30 min-h-[52px] shadow-sm">
  <!-- Left: Hamburger + Logo -->
  <!-- Center: SearchBar -->
  <!-- Right: Dark mode + Notifications + User -->
</nav>
```

### 2. Add subnav section between navbar and breadcrumb

Insert after the `</nav>` closing tag (line 810) and before the breadcrumb div (line 813):

```html
<!-- ── Subnav: Module Navigation Links ── -->
<nav class="subnav bg-base-100/95 backdrop-blur-md border-b border-base-300">
  <div class="max-w-7xl mx-auto px-4">
    <ul class="subnav-scroll flex items-center gap-0.5 overflow-x-auto py-0 scrollbar-hide">
      <!-- Module links rendered here -->
      <template v-for="mod in modules" :key="mod.key">
        <li v-if="mod.visible" class="shrink-0">
          <router-link
            :to="mod.to"
            class="subnav-link"
            :class="{ 'subnav-link--active': route.path.startsWith(mod.to) }"
          >
            <component :is="mod.icon" class="w-4 h-4" />
            <span>{{ mod.label }}</span>
          </router-link>
        </li>
      </template>
    </ul>
  </div>
</nav>
```

### 3. Add scoped CSS

```css
.subnav-link {
  @apply flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap;
  color: theme('colors.base-content');
}
.subnav-link:hover {
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
.subnav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.subnav-scroll::-webkit-scrollbar {
  display: none;
}
```

### 4. Update MobileBottomNav (optional)

The mobile bottom nav already provides quick access to Dashboard, Content, Alerts, Settings, More. The subnav will also be visible on mobile (scrollable), so mobile users get both the bottom nav tabs and the scrollable subnav.

## Theme Compatibility

| Token | Light (county) | Dark (county-dark) |
|-------|----------------|-------------------|
| `base-100` | `#F5F5F7` | `#1C1C1E` |
| `base-content` | `#1D1D1F` | `#F5F5F7` |
| `neutral` | `#F5F5F7` | `#1C1C1E` |
| `primary` | `#0071E3` | `#0A84FF` |

Both themes will have crisp, readable text since we use solid `base-content` color with no opacity tricks.
