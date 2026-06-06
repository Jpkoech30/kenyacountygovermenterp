# Admin UI Audit & Recommendations

## Current State Analysis

After the Slack-inspired color scheme migration, I've identified the following issues across [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue) and [`tailwind.config.js`](frontend/tailwind.config.js):

---

## 1. Stale CSS Artifacts (Leftover from Apple/Blue Navbar Era)

### Issue: Hamburger button still has `text-white hover:bg-white/15`
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:601)
```html
<label for="app-drawer" class="btn btn-square btn-ghost text-white hover:bg-white/15">
```
The navbar is now white (`bg-base-100`), so `text-white` makes the hamburger icon invisible. Should be `text-base-content hover:bg-base-300`.

### Issue: Logo badge still has `bg-white/20 text-white`
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:608-609)
```html
<div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
  <span class="text-sm font-bold text-white">WP</span>
```
Should use `bg-primary/10 text-primary` to match the user avatar style.

### Issue: Logo text still has `text-white/90`
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:611)
```html
<span class="text-sm font-semibold text-white/90 hidden xl:inline">West Pokot</span>
```
Should be `text-base-content/80`.

### Issue: `brand` color tokens in tailwind.config.js are still Apple colors
**File**: [`tailwind.config.js`](frontend/tailwind.config.js:32-37)
```js
brand: {
  red: "#FF3B30",      // Apple Red
  orange: "#FF9500",   // Apple Orange
  green: "#34C759",    // Apple Green
  purple: "#5856D6",   // iOS Purple
}
```
Should match Slack palette: `#E01E5A` (red), `#E8912D` (amber), `#007A5A` (green), `#4A154B` (Slack purple).

### Issue: Comment header in tailwind.config.js still references Apple
**File**: [`tailwind.config.js`](frontend/tailwind.config.js:10-31)
The JSDoc comment block still says "Apple-Inspired Color Theme Tokens" and lists Apple colors. Should reference Slack.

---

## 2. Hover State Inconsistencies

### Issue: Sidebar links have no hover state
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:5-8)
```css
.sidebar-link {
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
}
```
There's no `.sidebar-link:hover` rule. On a dark navy sidebar (`#1A1D21`), links at `text-neutral-content/80` need a hover background to feel interactive. Slack uses `rgba(255,255,255,0.08)` on hover.

### Issue: Subnav link hover uses `neutral` which is now dark navy
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:917-919)
```css
.subnav-link:hover {
  background: theme('colors.neutral');
}
```
`neutral` is now `#1A1D21` (Slack navy) — this will render as a dark blob on the white subnav. Should use `theme('colors.base-300')`.

### Issue: Pin button hover on sidebar links
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:835, 883)
```html
<button class="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity">
```
`hover:text-primary` on the dark sidebar will show Slack blue `#1264A3` — acceptable but Slack uses `#E8912D` (amber) for pin actions. Consider `hover:text-amber-400` for consistency.

### Issue: NotificationDropdown hover state unknown
The `NotificationDropdown` component is imported but its hover/active states aren't visible in this file. Should verify it uses `nav-icon-btn` class or similar.

---

## 3. Alignment & Spacing Inconsistencies

### Issue: Sidebar link icon and text alignment
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:828, 876)
```html
class="sidebar-link flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-content/80 rounded-md"
```
- `gap-3` (12px) between icon and text is generous. Slack uses 8px (`gap-2`). Consider tightening.
- `py-2` (8px) vertical padding. Slack uses 6px (`py-1.5`). Consider tightening for denser navigation.
- Icons are `w-4 h-4` (16px). Slack uses 18px icons. Consider `w-[18px] h-[18px]`.

### Issue: Subnav link padding vs sidebar link padding mismatch
- Subnav links: `px-3 py-2` (12px horizontal, 8px vertical)
- Sidebar links: `px-3 py-2` (same)
- But subnav has `gap-1.5` (6px) between icon and text, sidebar has `gap-3` (12px). This inconsistency is noticeable.

### Issue: Section header button padding
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:808, 851)
```html
class="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold ..."
```
`px-3` (12px) matches the links below, but the section header is inside a `p-1` (4px) container, creating a visual offset. Should be `px-2` to align with the container padding.

### Issue: Breadcrumb padding
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:761)
```html
<div v-if="breadcrumbs.length > 1" class="bg-base-200/30 border border-base-300 rounded-lg mx-2 my-1 px-4 lg:px-6 py-1.5">
```
`px-4 lg:px-6` doesn't match the content card's `p-4 lg:p-6`. The breadcrumb should be `px-4 lg:px-6` to match, but since it's inside `mx-2`, the visual alignment with the content card below will be off by the content card's border width. Consider removing `mx-2` from breadcrumb and using the same horizontal padding as the content card.

---

## 4. Accessibility Issues

### Issue: Focus indicators missing
None of the interactive elements (sidebar links, section toggles, subnav links) have visible `:focus-visible` styles. WCAG 2.1 SC 2.4.7 requires visible focus indicators.

**Fix**: Add to the unscoped CSS:
```css
.sidebar-link:focus-visible,
.subnav-link:focus-visible,
.section-toggle:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
}
```

### Issue: Color contrast on sidebar
- `text-neutral-content/80` on `bg-neutral` (`#1A1D21`): With 80% opacity on white, that's approximately `#CCCCCC` on `#1A1D21` — contrast ratio ~11.5:1. This passes WCAG AAA.
- `text-neutral-content/50` on `bg-neutral`: Approximately `#7F7F7F` on `#1A1D21` — contrast ratio ~4.8:1. This passes WCAG AA for large text (18px+) but FAILS for the 10px section headers. Should be at least `/60`.

### Issue: Breadcrumb link contrast
`text-base-content/60` on `bg-base-200/30` (which is `#F8F8F8` at 30% opacity = `#FDFDFD` effectively). `#1D1D1F` at 60% = `#6B6B6D` on `#FDFDFD` — contrast ratio ~5.2:1. Passes AA for normal text. Acceptable.

### Issue: Pin buttons have no accessible name on hover-only
The pin/unpin buttons rely on `opacity-0 group-hover:opacity-100` — they're invisible until hover. This fails WCAG SC 1.4.1 (Use of Color) because the information is conveyed only by hover. The buttons do have `aria-label` attributes, which is good, but the icons should have some persistent visual indicator (e.g., a subtle outline when not hovered).

---

## 5. Transition & Animation Inconsistencies

### Issue: Mixed transition durations
- Sidebar links: `transition: background-color 0.15s ease` (150ms)
- Subnav links: `transition-colors duration-150` (150ms via Tailwind)
- Section toggles: `transition-transform duration-200` (200ms)
- Pin buttons: `transition-opacity` (no duration specified — defaults to Tailwind's `duration-150`)

These are mostly consistent (150ms), but the Chevron rotation uses 200ms. Standardize to 150ms for all micro-interactions.

### Issue: No transition on sidebar link hover
The `.sidebar-link` has `transition: background-color 0.15s ease` but there's no hover rule to trigger it. Adding a hover background will make the transition meaningful.

---

## Recommended Fixes Summary

### Priority 1 — Bugs (broken visuals)

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 1 | AdminLayout.vue | 601 | `text-white hover:bg-white/15` | `text-base-content hover:bg-base-300` |
| 2 | AdminLayout.vue | 608-609 | `bg-white/20 text-white` | `bg-primary/10 text-primary` |
| 3 | AdminLayout.vue | 611 | `text-white/90` | `text-base-content/80` |
| 4 | AdminLayout.vue | 918 | `background: theme('colors.neutral')` | `background: theme('colors.base-300')` |

### Priority 2 — Hover States

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 5 | AdminLayout.vue | CSS | No `.sidebar-link:hover` | Add `background: rgba(255,255,255,0.08)` |
| 6 | AdminLayout.vue | 835, 883 | `hover:text-primary` | `hover:text-amber-400` (consistent pin color) |

### Priority 3 — Alignment

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 7 | AdminLayout.vue | 828, 876 | `gap-3` | `gap-2` (match Slack density) |
| 8 | AdminLayout.vue | 828, 876 | `py-2` | `py-1.5` (tighter nav) |
| 9 | AdminLayout.vue | 808, 851 | `px-3` | `px-2` (align with container) |

### Priority 4 — Accessibility

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 10 | AdminLayout.vue | CSS | No `:focus-visible` | Add focus ring styles |
| 11 | AdminLayout.vue | 808, 851 | `text-neutral-content/50` | `text-neutral-content/60` (contrast fix) |

### Priority 5 — Cleanup

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 12 | tailwind.config.js | 10-31 | Apple comments | Slack comments |
| 13 | tailwind.config.js | 32-37 | Apple brand colors | Slack brand colors |
| 14 | AdminLayout.vue | 761 | Breadcrumb `mx-2` | Remove `mx-2`, align padding with content card |
