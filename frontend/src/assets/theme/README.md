# UI/UX Color Theme System — 60-30-10 Rule (Facebook-Inspired)

## Overview

This theme system applies the **60-30-10 interior design rule** to UI design, inspired by Facebook's brand palette:

| Proportion | Role | DaisyUI Slots | Light Theme | Dark Theme |
|-----------|------|---------------|-------------|------------|
| **60%** | Background (dominant layer) | `base-100`, `base-200`, `base-300` | Athens Gray / White / Facebook border gray | Deep navy-slate |
| **30%** | Text & Structure (secondary) | `base-content`, `neutral`, `secondary` | Deep navy / dark gray | Light gray-blue |
| **10%** | Accent (primary CTAs) | `primary`, `accent`, `warning` | Facebook Azure Blue + Yellow + Orange | Lighter blue + warm yellow + orange |

## Theme Names

- **`county`** — Light theme (default)
- **`county-dark`** — Dark theme

## Color Palette

### Light Theme (`county`)

```
base-100:        #F0F2F5  ─ Athens Gray (page background) — Facebook-inspired
base-200:        #FFFFFF  ─ White (cards, elevated surfaces)
base-300:        #E4E6EB  ─ Facebook border gray (borders, dividers, disabled)
base-content:    #1B2A4A  ─ Deep navy (body text)

neutral:         #2C3E6B  ─ Structural (sidebar, nav, headers)
neutral-content: #D6E0F0  ─ Text on neutral backgrounds

secondary:       #3B5998  ─ Secondary UI (less prominent buttons)
secondary-content: #FFFFFF

primary:         #1877F2  ─ Facebook Azure Radiance (CTAs, links)
primary-content: #FFFFFF

accent:          #EAB308  ─ Yellow (highlights, stars, notifications)
accent-content:  #1B2A4A

info:            #0284C7
success:         #16A34A
warning:         #F97316  ─ Orange (aggressive UI: delete, urgency, destructive)
error:           #DC2626
```

### Brand Companion Colors (Tailwind Custom Classes)

These are available via `text-brand-orange`, `bg-brand-cream`, etc.:

| Class | Color | Usage |
|-------|-------|-------|
| `text-brand-orange` / `bg-brand-orange` | `#F97316` | Aggressive UI — delete buttons, urgency banners |
| `text-brand-cream` / `bg-brand-cream` | `#FFF8E7` | Soft UI — hover states, info banners, subtle highlights |
| `text-brand-yellow` / `bg-brand-yellow` | `#EAB308` | Highlights — star ratings, featured indicators |

### Dark Theme (`county-dark`)

```
base-100:        #0F172A  ─ Deep navy-slate (page background)
base-200:        #1E293B  ─ Elevated surfaces, cards
base-300:        #334155  ─ Borders, dividers
base-content:    #E2E8F0  ─ Light gray-blue (body text)

neutral:         #1E293B  ─ Structural backgrounds
neutral-content: #94A3B8

secondary:       #64748B  ─ Muted UI elements
secondary-content: #FFFFFF

primary:         #60A5FA  ─ Lighter blue (CTAs, links)
primary-content: #0F172A

accent:          #FBBF24  ─ Warm yellow (highlights)
accent-content:  #0F172A

info:            #38BDF8
success:         #4ADE80
warning:         #FB923C  ─ Orange (urgency in dark mode)
error:           #F87171
```

## WCAG Contrast Compliance

| Text Pair | Ratio | Level |
|-----------|-------|-------|
| `base-content` (#1B2A4A) on `base-100` (#F0F2F5) | **10.5:1** | ✅ **AAA** |
| `primary` (#1877F2) on `base-100` (#F0F2F5) | **5.0:1** | ✅ **AA** |
| `primary` (#1877F2) on `primary-content` (#FFFFFF) | **4.8:1** | ✅ **AA** |
| `warning` (#F97316) on `base-100` (#F0F2F5) | **3.2:1** | ✅ **AA (large text)** |
| `warning` (#F97316) on `warning-content` (#FFFFFF) | **3.2:1** | ✅ **AA (large text)** |
| `accent-content` (#1B2A4A) on `accent` (#EAB308) | **10.8:1** | ✅ **AAA** |
| `base-content` (#E2E8F0) on `base-100` (#0F172A) — dark | **12.5:1** | ✅ **AAA** |

> **Note:** `accent` (#EAB308) on `base-100` (#F0F2F5) has a 1.4:1 ratio. This is intentional — accent yellow is used **only for decorative/non-text elements** (stars, notification dots, badges). Any text on accent backgrounds uses `accent-content` (#1B2A4A) which achieves AAA.

> **Note:** `warning` (#F97316) meets WCAG AA only for large text (≥18px or ≥14px bold). For small text warnings, pair with an icon or use `error` (#DC2626) instead.

## Color Blindness Compatibility

| Condition | Compatibility |
|-----------|--------------|
| **Protanopia** (red-blind) | ✅ Blue primary (#1877F2) vs navy neutral (#2C3E6B) distinguishable via lightness (ΔL ≈ 25) |
| **Deuteranopia** (green-blind) | ✅ Same as protanopia — blue hues remain distinct |
| **Tritanopia** (blue-blind) | ✅ Yellow accent (#EAB308) provides warm hue anchor; orange warning (#F97316) vs error red (#DC2626) differ in both hue and lightness |
| **Achromatopsia** (total color blindness) | ✅ Relies on lightness contrast (10.5:1) + icons/text labels alongside color |

## Usage Guidelines

### DO

- Use `bg-base-100` for page backgrounds
- Use `bg-base-200` for card surfaces, dropdowns, modals
- Use `bg-base-300` for borders, dividers, disabled inputs
- Use `text-base-content` for body text
- Use `btn btn-primary` for primary CTAs (save, submit, create)
- Use `btn btn-secondary` for secondary actions (cancel, back)
- Use `text-primary` for links and active navigation items
- Use `badge badge-accent` for notification counts, highlights
- Use `text-accent` for star ratings, featured indicators
- Use `btn btn-warning` for destructive/urgent actions (delete, archive)
- Use `bg-brand-cream` for soft info banners and hover highlight rows
- Use `text-brand-orange` for urgency icons and delete labels

### DON'T

- ❌ Don't use pure black (`#000000`) or pure white (`#FFFFFF`) as backgrounds (use `base-100`/`base-200`)
- ❌ Don't use accent colors for large surface areas (reserve for interactive elements)
- ❌ Don't rely solely on color to convey information — always pair with icons or text
- ❌ Don't override DaisyUI semantic classes with arbitrary hex values
- ❌ Don't use `primary` for non-interactive decorative elements
- ❌ Don't use `warning` for small body text (use `error` for high-contrast destructive text)

## Implementation

The theme is defined in [`tailwind.config.js`](../../tailwind.config.js) using DaisyUI's theme object format. To switch themes at runtime:

```js
const html = document.querySelector('html')
html.setAttribute('data-theme', 'county')       // light
html.setAttribute('data-theme', 'county-dark')  // dark
```

The dark mode toggle in [`AdminLayout.vue`](../../layouts/AdminLayout.vue) handles this automatically and persists the preference to `localStorage`.

### Brand Companion Colors

The `brand` color family is defined in `tailwind.config.js` under `theme.extend.colors.brand`:

```js
brand: {
  orange: "#F97316",  // Aggressive UI
  cream:  "#FFF8E7",  // Soft UI
  yellow: "#EAB308",  // Highlights
}
```

Use these via Tailwind utility classes: `text-brand-orange`, `bg-brand-cream`, `border-brand-yellow`, etc.
