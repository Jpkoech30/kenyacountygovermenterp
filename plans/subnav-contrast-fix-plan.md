# Subnav Contrast Fix Plan

## Problem

The subnav navigation links in [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:185) are barely visible in light mode because:

1. **Subnav background**: `bg-base-200/80 backdrop-blur-md` — `base-200` is `#FFFFFF` (white) at 80% opacity with backdrop blur. On the page background `base-100` (`#F5F5F7`), this creates a translucent white bar with no visual separation.

2. **Text color**: `theme('colors.base-content / 90%')` — `base-content` is `#1D1D1F` at 90% opacity = `rgba(29, 29, 31, 0.9)` ≈ `#333`. On a white-ish background, this renders as dark gray rather than crisp black, making it feel washed out.

3. **No visual hierarchy**: The subnav blends into the top bar and page content because both use similar white/light backgrounds with no clear separation.

## Root Cause

The original design tried to use opacity-based text (70%, now 90%) which is an anti-pattern for accessibility. Apple's HIG uses **solid colors** for text — `#1D1D1F` for body text, `#86868B` for secondary labels. Opacity-based text renders inconsistently across browsers and themes.

## Fix Plan

### 1. Change subnav background to use `neutral` instead of `base-200`

The `neutral` token is `#F5F5F7` — same as the page background. This creates a seamless look. But we need the subnav to feel distinct from the content below, so we add a subtle bottom border/separator.

**Change**: `bg-base-200/80 backdrop-blur-md` → `bg-base-100/95 backdrop-blur-md`

This keeps the subnav at the same visual level as the page background but with a slight blur effect for depth.

### 2. Use solid `base-content` color for link text

Remove all opacity from text color. Use `theme('colors.base-content')` directly — `#1D1D1F` — which is Apple's near-black and provides maximum readability.

### 3. Add a subtle bottom border for visual separation

The subnav already has `border-b border-base-300` which gives a `#E8E8ED` separator line. This is sufficient for visual hierarchy when combined with solid text.

### 4. Hover state: use `neutral` background tint

Change hover background from `base-300 / 50%` to `neutral` (`#F5F5F7`) — this provides a subtle gray pill effect on hover without relying on opacity.

### 5. Active state: keep primary color but add solid background

Active links use `theme('colors.primary')` (`#0071E3`) with `primary / 8%` background. This is fine — the blue provides clear active indication.

## Files to Modify

| File | Change |
|------|--------|
| [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:185) | Subnav `nav` element: `bg-base-200/80 backdrop-blur-md` → `bg-base-100/95 backdrop-blur-md` |
| [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:249) | `.subnav-link` color: `theme('colors.base-content / 90%')` → `theme('colors.base-content')` |
| [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:253) | `.subnav-link:hover` background: `theme('colors.base-300 / 50%')` → `theme('colors.neutral')` |
| [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:310) | `.subnav::before` gradient: `theme('colors.base-200')` → `theme('colors.base-100')` |
| [`AppHeader.vue`](../frontend/src/components/public/AppHeader.vue:314) | `.subnav::after` gradient: `theme('colors.base-200')` → `theme('colors.base-100')` |

## Visual Result (Light Mode)

```
┌─────────────────────────────────────────────────┐
│  Logo    [Search]          🌐  ♿               │  ← Top bar (bg-base-100, border-b)
├─────────────────────────────────────────────────┤
│  Home  Departments  Services  Documents  About  │  ← Subnav (bg-base-100/95, solid #1D1D1F text)
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│                                                  │
│  Page Content                                    │  ← Content area
│                                                  │
└─────────────────────────────────────────────────┘
```

The subnav is visually anchored by:
- Same background as page (`base-100`) — seamless integration
- Solid `#1D1D1F` text — maximum readability
- Bottom border (`#E8E8ED`) — clear separation from content
- Hover pill effect — interactive feedback
- Active blue underline — current page indication
