# Facebook UI/UX Enhancement Prompt — West Pokot County ERP

## Objective

Transform the West Pokot County ERP admin interface to closely mirror Facebook's intuitive, polished, and user-friendly design language. Build upon the existing Facebook-inspired color theme (60-30-10 rule with `#1877F2` primary blue, Athens Gray `#F0F2F5` background, white cards) and the blue top navbar already implemented in [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue). The goal is to elevate every surface — navigation, content presentation, interactions, and responsive behavior — to match Facebook's level of UX refinement.

---

## Guiding Principles

1. **Familiarity** — Users should feel instantly at home with patterns they recognize from Facebook: the blue top bar, the three-column layout, the card-based feed, the subtle hover states.
2. **Consistency** — Every button, card, dropdown, and link must share the same spacing scale, border radius, typography hierarchy, and color semantics.
3. **Accessibility** — All interactive elements must meet WCAG AA at minimum. Use semantic HTML, ARIA roles, focus management, and sufficient color contrast.
4. **Performance** — Lazy-load below-fold content, debounce search inputs, use Vue's `<Transition>` for route changes, and keep bundle size lean via code-splitting.
5. **Maintainability** — Leverage existing DaisyUI components, Tailwind utility classes, and Vue composables. Avoid custom CSS where DaisyUI provides a slot or modifier.

---

## Current State (Already Implemented)

The following is already in place and should be preserved:

| Feature | Status | Location |
|---------|--------|----------|
| Blue top navbar (`bg-primary`, `#1877F2`) with white text | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:529) |
| "WP" logo badge + "West Pokot" text in navbar | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:538) |
| White-on-blue quick action links with hover/active states | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:551) |
| User avatar with green online indicator dot | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:649) |
| Compact sidebar (`w-64`) with blue left active indicator bar | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:665) |
| Athens Gray `#F0F2F5` page background | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:660) |
| Max-width centered content container (`max-w-7xl mx-auto`) | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:661) |
| White breadcrumb bar below blue navbar | ✅ Done | [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:653) |
| Facebook-inspired color theme (county / county-dark) | ✅ Done | [`tailwind.config.js`](../frontend/tailwind.config.js:83) |
| Brand companion colors (brand.orange, brand.cream, brand.yellow) | ✅ Done | [`tailwind.config.js`](../frontend/tailwind.config.js:26) |
| WCAG-compliant contrast ratios documented | ✅ Done | [`theme/README.md`](../frontend/src/assets/theme/README.md:82) |

---

## Feature Requirements

### 1. Fixed Blue Top Navigation Bar (Enhance)

**Current:** Blue bar with logo, quick action links, dark mode toggle, and user avatar.

**Enhancements needed:**

- [ ] **Search bar** — Add a Facebook-style search input in the center of the navbar (visible on desktop, collapsible on mobile). Use a magnifying glass icon, placeholder text "Search content, people, menus...", and a debounced search that navigates to a search results page or opens a modal. Style it as a rounded white/light-gray input with `bg-white/20` on the blue background.
- [ ] **Notifications dropdown** — Add a bell icon button next to the dark mode toggle. On click, show a white dropdown panel with a list of recent notifications (e.g., "Content #42 submitted for review", "Leave request approved"). Each notification should have an icon, message text, and timestamp. Include a "Mark all as read" link at the bottom. Use `aria-label="Notifications"`, `aria-haspopup="true"`, `:aria-expanded`.
- [ ] **User menu enhancement** — The existing avatar dropdown should include: user name + role at top, a divider, "Profile" link, "Settings" link, and "Logout" with an icon. Add keyboard navigation (arrow keys, Escape to close).

### 2. Left Sidebar — Shortcuts & Groups (Enhance)

**Current:** Compact sidebar with module links and blue active indicator.

**Enhancements needed:**

- [ ] **Section headers** — Group sidebar links into labeled sections (e.g., "MAIN", "MANAGEMENT", "ADMIN") with uppercase, small, gray section labels — matching Facebook's sidebar grouping.
- [ ] **Shortcut pins** — Allow users to "pin" frequently used pages to the top of the sidebar. Store pinned items in `localStorage`. Show a small pin icon on hover over any sidebar link.
- [ ] **Active state refinement** — The blue left bar (`3px`, `#1877F2`) should animate in smoothly on route change. Use Vue's `<Transition>` on the sidebar links for a subtle slide-in effect.
- [ ] **Collapsible groups** — For modules with many sub-items (e.g., Content Management → News, Events, Tenders...), use a collapsible accordion pattern with a chevron icon that rotates on expand. This keeps the sidebar compact.

### 3. Central Content Area — Card-Based Feed (New)

**Current:** Standard page content rendered by `<router-view>`.

**New feature — Facebook-style content feed:**

- [ ] **Create a `ContentFeed.vue` component** at [`components/ContentFeed.vue`](../frontend/src/components/ContentFeed.vue) that renders a scrollable list of content cards, similar to Facebook's News Feed. Each card should display:
  - **Header**: Author avatar + name, content type badge (e.g., "News", "Event"), relative timestamp ("2 hours ago")
  - **Body**: Title (linked), excerpt, featured image (if any)
  - **Actions bar**: Like button (thumbs-up icon + count), Comment button (speech bubble icon + count), Share button (share icon)
- [ ] **Like/React** — Implement a simple like toggle. Clicking the Like button should toggle a filled/unfilled state and increment/decrement a counter. Store likes in a Pinia store or via API.
- [ ] **Comment sheet** — Clicking Comment should expand an inline comment section below the card with a text input and a list of existing comments. Each comment shows avatar, name, text, and timestamp.
- [ ] **Share action** — Clicking Share opens a small modal with options: "Copy link", "Share via Email". Use the existing [`ConfirmDialog.vue`](../frontend/src/components/ConfirmDialog.vue) pattern or create a lightweight `ShareModal.vue`.
- [ ] **Infinite scroll** — Use an `IntersectionObserver` on a sentinel element at the bottom of the feed to load more content pages. Integrate with the existing `useContentStore` pagination.

### 4. Right Sidebar — Trending & Suggestions (New)

**Current:** No right sidebar exists.

**New feature:**

- [ ] **Create a right sidebar panel** in [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue) that appears on `xl:` screens and above (`hidden xl:flex`). Width: `w-72`. Position it to the right of the main content area, inside the drawer-content flex container.
- [ ] **Trending Topics** — A card showing the top 5 most-viewed or most-active content items this week. Each item is a clickable link with a small graph icon and view count. Data can come from a new API endpoint or be derived from existing content metadata.
- [ ] **Quick Stats** — A compact card showing key metrics: "Total Content: 142", "Pending Review: 12", "Published Today: 3". Use small text and subtle icons.
- [ ] **Recent Activity** — A list of the last 5 actions taken by any user (e.g., "John published 'Budget Report'", "Jane submitted 'Leave Policy' for review"). This can use the existing workflow log data.
- [ ] **Responsive behavior** — On `lg` screens, the right sidebar should collapse into a floating button (a small circle with a ">" icon) that slides the panel in from the right as an overlay.

### 5. Responsive Design Adjustments

**Current:** Basic responsive behavior via DaisyUI drawer and Tailwind breakpoints.

**Enhancements needed:**

- [ ] **Mobile bottom navigation** — On screens smaller than `lg`, replace the top navbar quick action links with a fixed bottom navigation bar containing 4-5 icon-only buttons: Home (dashboard icon), Content (file icon), Notifications (bell icon), Profile (user icon). This matches Facebook's mobile app pattern.
- [ ] **Sidebar as overlay on tablet** — On `md` screens, the sidebar should slide in as an overlay (not push content). The current DaisyUI drawer already does this, but ensure the overlay has a semi-transparent backdrop (`bg-black/30`) and smooth slide transition.
- [ ] **Content feed single-column** — On mobile, the content feed should be full-width with no sidebars. On tablet (`md`), show the left sidebar. On desktop (`lg`), show left sidebar + content. On wide (`xl`), show left sidebar + content + right sidebar.
- [ ] **Touch targets** — Ensure all interactive elements are at least `44x44px` on touch devices. Buttons, links, and dropdown triggers should have `min-h-[44px]` and `min-w-[44px]` on mobile.

### 6. Typography & Spacing Consistency

**Current:** Mixed font sizes and spacing across components.

**Standardize to Facebook's scale:**

- [ ] **Font stack** — Use the existing system font stack (already in DaisyUI). Ensure `font-sans` is applied globally.
- [ ] **Type scale** — Define a consistent type scale in [`tailwind.config.js`](../frontend/tailwind.config.js) `theme.extend.fontSize`:
  - `xs`: `0.75rem` (12px) — metadata, timestamps
  - `sm`: `0.8125rem` (13px) — body text, card content
  - `base`: `0.9375rem` (15px) — Facebook's standard body size
  - `lg`: `1.0625rem` (17px) — card titles
  - `xl`: `1.25rem` (20px) — page headings
  - `2xl`: `1.5rem` (24px) — hero headings
- [ ] **Line height** — Set `leading-relaxed` (1.625) for body text, `leading-tight` (1.25) for headings.
- [ ] **Spacing scale** — Use Tailwind's default spacing scale consistently. Cards should have `p-4` on mobile, `p-5` on desktop. Gap between cards: `gap-4`. Section padding: `px-4 lg:px-6 py-4`.

### 7. Hover Effects & Smooth Transitions

**Current:** Basic hover states exist on sidebar links and quick action links.

**Enhancements needed:**

- [ ] **Card hover** — Add a subtle lift effect on cards: `hover:shadow-md transition-shadow duration-200` and `hover:-translate-y-0.5 transition-transform duration-200`.
- [ ] **Button press** — Ensure `active:scale-95` is applied to all clickable elements for tactile feedback. DaisyUI's `--btn-focus-scale: 0.97` already does this for buttons; extend to links and cards.
- [ ] **Link underline** — Add `hover:underline decoration-primary/30 decoration-2 underline-offset-2` to text links within card bodies.
- [ ] **Skeleton loading** — Replace the current `loading-spinner` with Facebook-style skeleton placeholders: gray animated blocks that match the shape of the content being loaded (a rectangle for the image, lines for text). Create a `SkeletonLoader.vue` component with props for `type` (card, list, table) and `count`.
- [ ] **Route transitions** — The existing `<Transition name="route">` in [`App.vue`](../frontend/src/App.vue:13) uses a 200ms fade + slide. Enhance it with a `mode="out-in"` and a slightly longer duration (250ms) for a smoother feel.

### 8. Accessibility (WCAG AA+)

**Current:** ARIA labels, roles, and semantic HTML are partially implemented.

**Full audit and fixes needed:**

- [ ] **Focus management** — When a dropdown opens (user menu, notifications, More links), focus should move to the first focusable item inside it. When it closes, focus should return to the trigger button. Use `ref` and `nextTick` to programmatically manage focus.
- [ ] **Keyboard navigation** — All dropdowns must support: `Enter`/`Space` to toggle, `Escape` to close, `ArrowUp`/`ArrowDown` to navigate items, `Tab` to move to next section.
- [ ] **Skip to content** — Add a "Skip to main content" link as the first focusable element in [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue). It should be visually hidden until focused (`sr-only focus:not-sr-only`).
- [ ] **Color contrast** — Verify all text/background pairs against WCAG AA. Document any exceptions (decorative-only elements) in the theme README.
- [ ] **Reduced motion** — Respect `prefers-reduced-motion`. Wrap all CSS transitions and animations in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **ARIA live regions** — Use `aria-live="polite"` on dynamic content areas (notification count, feed updates) so screen readers announce changes.

### 9. Performance Optimization

- [ ] **Lazy-load feed cards** — Use `defineAsyncComponent` for the `ContentFeed.vue` component so it's code-split from the main bundle.
- [ ] **Debounced search** — The navbar search input should use a 300ms debounce before firing the API call. Use the existing `watch` + `setTimeout` pattern from [`ContentEditorPage.vue`](../frontend/src/views/admin/ContentEditorPage.vue).
- [ ] **Virtual scrolling** — If the content feed grows large (100+ items), consider using a virtual scroller library or implementing a simple viewport-based render strategy.
- [ ] **Image lazy loading** — Ensure all `<img>` tags in cards use `loading="lazy"` and have explicit `width`/`height` attributes to prevent layout shift.
- [ ] **Bundle analysis** — Run `npx vite build --analyze` to identify large dependencies. Consider dynamic imports for heavy libraries (TipTap, chart libraries).

---

## Implementation Order

| Phase | Items | Dependencies |
|-------|-------|-------------|
| **Phase 1** | Search bar, Notifications dropdown, User menu enhancement | None — standalone navbar additions |
| **Phase 2** | Sidebar section headers, Collapsible groups, Shortcut pins | None — sidebar-only changes |
| **Phase 3** | ContentFeed.vue with Like/Comment/Share, Infinite scroll | Depends on Phase 1-2 for layout stability |
| **Phase 4** | Right sidebar (Trending, Quick Stats, Recent Activity) | Depends on Phase 3 for feed integration |
| **Phase 5** | Mobile bottom nav, Responsive breakpoint tuning, Touch targets | Depends on Phase 1-4 for full layout |
| **Phase 6** | Typography scale, Spacing audit, Hover effects, Skeleton loader | Can run in parallel with Phase 3-5 |
| **Phase 7** | Accessibility audit, Focus management, Keyboard nav, Reduced motion | Should be final pass across all components |

---

## Files to Create

| File | Purpose |
|------|---------|
| [`components/ContentFeed.vue`](../frontend/src/components/ContentFeed.vue) | Facebook-style card feed with Like/Comment/Share |
| [`components/ContentCard.vue`](../frontend/src/components/ContentCard.vue) | Individual feed card (header, body, actions) |
| [`components/CommentSection.vue`](../frontend/src/components/CommentSection.vue) | Inline comment list + input for a content card |
| [`components/ShareModal.vue`](../frontend/src/components/ShareModal.vue) | Share action modal (copy link, email) |
| [`components/SkeletonLoader.vue`](../frontend/src/components/SkeletonLoader.vue) | Facebook-style skeleton placeholders |
| [`components/NotificationDropdown.vue`](../frontend/src/components/NotificationDropdown.vue) | Bell icon + notification list dropdown |
| [`components/SearchBar.vue`](../frontend/src/components/SearchBar.vue) | Navbar search input with debounced results |
| [`components/RightSidebar.vue`](../frontend/src/components/RightSidebar.vue) | Trending, Quick Stats, Recent Activity panel |
| [`components/MobileBottomNav.vue`](../frontend/src/components/MobileBottomNav.vue) | Fixed bottom navigation for mobile |
| [`stores/notifications.js`](../frontend/src/stores/notifications.js) | Pinia store for notification state |
| [`stores/feed.js`](../frontend/src/stores/feed.js) | Pinia store for content feed state (likes, comments) |

## Files to Modify

| File | Changes |
|------|---------|
| [`layouts/AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue) | Integrate SearchBar, NotificationDropdown, RightSidebar, MobileBottomNav; add skip-to-content link; update sidebar with collapsible groups and section headers |
| [`tailwind.config.js`](../frontend/tailwind.config.js) | Add custom font size scale under `theme.extend.fontSize` |
| [`App.vue`](../frontend/src/App.vue) | Enhance route transition duration to 250ms; add `prefers-reduced-motion` media query |
| [`router/index.js`](../frontend/src/router/index.js) | Add search results route if needed |
| [`assets/main.css`](../frontend/src/assets/main.css) | Add global `prefers-reduced-motion` styles, skeleton animation keyframes |

---

## Acceptance Criteria

1. The blue top navbar includes a functional search bar, notifications dropdown with live data, and an enhanced user menu with keyboard navigation.
2. The left sidebar has section headers, collapsible groups with animated chevrons, and a working pin-to-top feature persisted in localStorage.
3. The content feed renders a scrollable list of cards with Like (toggle + count), Comment (inline expand), and Share (modal) actions.
4. Infinite scroll loads additional content pages via IntersectionObserver without duplicate entries.
5. The right sidebar displays trending topics, quick stats, and recent activity on `xl` screens, collapsing to a floating button on smaller screens.
6. Mobile bottom navigation replaces the top navbar quick links on screens below `lg` breakpoint.
7. All interactive elements have proper focus management, keyboard navigation, and ARIA attributes.
8. Skeleton loaders appear during data fetching instead of a spinner.
9. Typography follows the defined type scale with consistent line heights and spacing.
10. Build succeeds with `npx vite build` — 0 errors, 0 warnings.
11. All WCAG AA contrast ratios are verified; `prefers-reduced-motion` is respected.
12. No regressions in existing functionality (routing, auth, content CRUD, dark mode toggle).

---

## Example: ContentCard.vue Structure

```vue
<template>
  <article class="facebook-card p-4 hover:shadow-md transition-shadow duration-200">
    <!-- Header: avatar + name + type badge + timestamp -->
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
        {{ authorInitials }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">{{ authorName }}</p>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="badge badge-xs badge-primary">{{ contentType }}</span>
          <span>{{ relativeTime }}</span>
        </div>
      </div>
    </div>

    <!-- Body: title + excerpt + image -->
    <h3 class="text-base font-semibold text-gray-800 mb-1">{{ title }}</h3>
    <p v-if="excerpt" class="text-sm text-gray-600 mb-3 line-clamp-3">{{ excerpt }}</p>
    <img v-if="imageUrl" :src="imageUrl" :alt="title" loading="lazy"
         class="w-full rounded-lg mb-3 max-h-80 object-cover" />

    <!-- Actions: Like / Comment / Share -->
    <div class="flex items-center gap-1 border-t border-gray-100 pt-2">
      <button @click="toggleLike"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
              :class="liked ? 'text-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-100'"
              :aria-label="liked ? 'Unlike this post' : 'Like this post'">
        <ThumbsUp class="w-4 h-4" :fill="liked ? '#1877F2' : 'none'" aria-hidden="true" />
        <span>{{ likeCount }}</span>
      </button>
      <button @click="toggleComments"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors duration-150"
              :aria-label="showComments ? 'Hide comments' : 'Show comments'">
        <MessageCircle class="w-4 h-4" aria-hidden="true" />
        <span>{{ commentCount }}</span>
      </button>
      <button @click="openShare"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors duration-150"
              aria-label="Share this post">
        <Share2 class="w-4 h-4" aria-hidden="true" />
        <span>Share</span>
      </button>
    </div>

    <!-- Inline comments -->
    <CommentSection v-if="showComments" :content-id="id" class="mt-3" />
  </article>
</template>
```

---

## Example: DaisyUI + Tailwind Implementation Patterns

Use these patterns throughout to maintain consistency:

```vue
<!-- Facebook-style card -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
  <!-- card content -->
</div>

<!-- Facebook-style button (subtle gray) -->
<button class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors duration-150">
  <!-- icon + label -->
</button>

<!-- Facebook-style primary button -->
<button class="btn btn-primary btn-sm text-white">
  <!-- label -->
</button>

<!-- Facebook-style badge -->
<span class="badge badge-xs badge-primary text-white">News</span>

<!-- Facebook-style divider -->
<hr class="border-gray-100 my-2" />

<!-- Facebook-style section header -->
<span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1">Section Name</span>
```

---

## Color Reference (Already Configured)

Use these DaisyUI semantic classes — do NOT hardcode hex values:

| Semantic | Class | Hex | Usage |
|----------|-------|-----|-------|
| Page background | `bg-base-100` | `#F0F2F5` | Page, sidebar background |
| Card surface | `bg-base-200` or `bg-white` | `#FFFFFF` | Cards, dropdowns, modals |
| Borders | `border-base-300` | `#E4E6EB` | Card borders, dividers |
| Body text | `text-base-content` | `#1B2A4A` | Primary text |
| Muted text | `text-base-content/60` | — | Secondary text, timestamps |
| Primary CTA | `bg-primary` / `text-primary` | `#1877F2` | Buttons, links, active states |
| Warning/Urgency | `text-warning` / `bg-warning` | `#F97316` | Delete buttons, alerts |
| Highlights | `text-accent` / `bg-accent` | `#EAB308` | Stars, featured badges |
| Brand orange | `text-brand-orange` | `#F97316` | Aggressive UI |
| Brand cream | `bg-brand-cream` | `#FFF8E7` | Soft hover, banners |
| Brand yellow | `text-brand-yellow` | `#EAB308` | Star ratings |

---

## Deliverables

1. All new components in [`components/`](../frontend/src/components/) with proper JSDoc comments and prop/event typing.
2. Updated [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue) integrating all new components.
3. Updated [`tailwind.config.js`](../frontend/tailwind.config.js) with the type scale.
4. New Pinia stores for notifications and feed state.
5. Updated theme documentation in [`theme/README.md`](../frontend/src/assets/theme/README.md) covering new components and patterns.
6. Production build passing with `npx vite build` — 0 errors.
7. Accessibility audit report confirming WCAG AA compliance for all new components.
