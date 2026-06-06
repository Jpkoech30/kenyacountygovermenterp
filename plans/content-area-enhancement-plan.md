# Content Area Visual Enhancement Plan

## Current State

The content area at [`AdminLayout.vue:796-801`](frontend/src/layouts/AdminLayout.vue:796) is a plain white card:

```html
<main class="flex-1 bg-base-200 pb-16 lg:pb-0 px-2">
  <div class="max-w-7xl mx-auto bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 lg:p-6">
    <router-view />
  </div>
</main>
```

This is functional but lacks visual hierarchy, depth cues, and polish for the primary user interaction zone.

## Enhancements

### 1. Add a subtle page header inside the content card

Currently, pages render directly inside `<router-view />` with no consistent top padding or title treatment. Add a content header slot/area that provides:
- A subtle top border accent (primary color, 2px, rounded)
- Consistent heading area with breadcrumb context

### 2. Upgrade the content card visual treatment

| Property | Current | Proposed |
|----------|---------|----------|
| Background | `bg-base-100` (white) | `bg-base-100` (white) — keep |
| Border | `border border-base-300` | `border border-base-200/80` — softer |
| Shadow | `shadow-sm` | `shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]` — Apple-sm |
| Border radius | `rounded-xl` | `rounded-xl` — keep |
| Inner padding | `p-4 lg:p-6` | `p-4 lg:p-6` — keep |
| **Top accent** | none | Add a 2px primary-color top border strip via `border-t-2 border-t-primary/20 rounded-t-xl` |

### 3. Add content area transition/animation

Wrap `<router-view />` with a transition for route changes:
```html
<transition name="content-fade" mode="out-in">
  <router-view />
</transition>
```

CSS:
```css
.content-fade-enter-active,
.content-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.content-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
```

### 4. Add utility classes to `main.css` for content-area components

Add reusable component classes that page views can use:

```css
/* Content card inner sections */
.content-section {
  @apply bg-base-100 rounded-lg border border-base-200 p-4;
}
.content-section-header {
  @apply flex items-center justify-between mb-4 pb-3 border-b border-base-200;
}
.content-section-title {
  @apply text-base font-semibold text-base-content;
}

/* Data table wrapper */
.content-table-wrap {
  @apply overflow-x-auto rounded-lg border border-base-200;
}

/* Stats / metric cards for dashboards */
.stat-card {
  @apply bg-base-100 rounded-xl border border-base-200 p-4 transition-all duration-150;
}
.stat-card:hover {
  @apply shadow-[0_4px_12px_rgba(0,0,0,0.06)] border-base-300;
}
```

### 5. Add a subtle inner shadow to the content card for depth

Replace the flat `shadow-sm` with a layered shadow that gives the content card a slight elevation above the gray background:

```
shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]
```

This is the existing `apple-sm` shadow from [`tailwind.config.js:87`](frontend/tailwind.config.js:87) — subtle but effective.

### 6. Add a page-level loading state

Add a `Suspense` boundary or loading indicator that shows a subtle skeleton pulse while `<router-view />` content loads:

```html
<router-view v-slot="{ Component }">
  <transition name="content-fade" mode="out-in">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

## Files to Modify

| File | Changes |
|------|---------|
| [`AdminLayout.vue:796-801`](frontend/src/layouts/AdminLayout.vue:796) | Upgrade content card with top accent border, softer shadow, route transition wrapper |
| [`main.css`](frontend/src/assets/main.css) | Add `.content-fade-*` transition classes, `.content-section`, `.stat-card`, `.content-table-wrap` utility classes |
| [`tailwind.config.js:82-91`](frontend/tailwind.config.js:82) | Already has `apple-sm` shadow — no change needed |

## Priority Order

1. **Content card upgrade** (shadow, border, top accent) — biggest visual impact, single line change
2. **Route transition** — adds polished feel when navigating between pages
3. **Utility classes in main.css** — enables page views to use consistent card/table/section styling
4. **Loading state** — nice-to-have, can be deferred
