# Slack-Inspired Admin Color Scheme Plan

## Problem
The current admin layout uses an Apple-inspired palette where the top navbar is `primary` blue (`#0071E3`), sidebar is light gray (`base-100`), and content is also light gray. The blue navbar clashes with the light sidebar and content — no clear visual hierarchy.

## Slack's Model
Slack separates the UI into 3 distinct visual zones:
1. **Sidebar**: Dark navy (`#1A1D21` or `#350D36`) — recedes, lets content breathe
2. **Top bar**: White/light — clean, functional, utilitarian
3. **Content**: White — the focus area

## Proposed Changes

### A. Theme Colors — [`tailwind.config.js`](frontend/tailwind.config.js)

**Light theme (`county`)** — Slack-inspired:

| Token | Current (Apple) | Proposed (Slack) | Notes |
|-------|----------------|------------------|-------|
| `primary` | `#0071E3` (blue) | `#1264A3` (Slack blue) | Primary CTAs, links |
| `base-100` | `#F5F5F7` (light gray) | `#FFFFFF` (white) | Page/content background |
| `base-200` | `#FFFFFF` (white) | `#F8F8F8` (off-white) | Card surfaces |
| `base-300` | `#E8E8ED` (sep gray) | `#E0E0E0` (light border) | Borders, dividers |
| `neutral` | `#F5F5F7` | `#1A1D21` (Slack navy) | Sidebar background |
| `neutral-content` | `#86868B` | `#FFFFFF` | Sidebar text |
| `secondary` | `#86868B` | `#616061` (Slack gray) | Secondary text |
| `success` | `#34C759` | `#007A5A` (Slack green) | Success states |

**Dark theme (`county-dark`)** — Slack dark mode:

| Token | Current | Proposed |
|-------|---------|----------|
| `primary` | `#0A84FF` | `#1D9BD1` |
| `base-100` | `#1C1C1E` | `#1A1D21` (Slack dark) |
| `base-200` | `#2C2C2E` | `#222529` |
| `base-300` | `#3A3A3C` | `#2E3136` |
| `neutral` | `#1C1C1E` | `#111318` (darker sidebar) |
| `neutral-content` | `#8E8E93` | `#D1D2D3` |

### B. AdminLayout.vue — Structural Changes

1. **Top navbar** (line 601): Change from `bg-primary text-primary-content` to `bg-base-100 border-b border-base-300 text-base-content` — white navbar like Slack
2. **Sidebar** (line 794): Change from `bg-base-100` to `bg-neutral text-neutral-content` — dark navy sidebar like Slack
3. **Sidebar link text** (lines 831, 878): Change from `text-base-content` to `text-neutral-content/80` with hover `text-neutral-content` — white text on dark bg
4. **Sidebar section headers** (lines 811, 853): Change from `text-base-content/60` to `text-neutral-content/50` — subtle on dark bg
5. **Sidebar active link**: Add `bg-white/10 text-white` for active state on dark sidebar
6. **Sidebar header** (line 796): Change `border-base-300` to `border-white/10` — subtle divider on dark bg
7. **Subnav** (line 669): Change from `bg-base-100/95` to `bg-base-100 border-b border-base-300` — clean white subnav
8. **Content card** (line 784): Change from `bg-base-200/50` to `bg-base-100` — white content area

### C. Visual Hierarchy After Changes

```
┌─────────────────────────────────────────┐
│   White Top Navbar (bg-base-100)        │  ← clean, utilitarian
│   Logo | Search | Notifications | User  │
├─────────────────────────────────────────┤
│   White Subnav (bg-base-100)            │  ← module links
│   [Link] [Link] [Link] [More ▾]         │
├─────────────────────────────────────────┤
│   Breadcrumb (subtle)                   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │   White Content Card            │    │  ← focus area
│  │   (bg-base-100)                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
     Dark Sidebar (bg-neutral)
     ┌──────────────────────┐
     │  West Pokot          │  ← white text on dark navy
     │  County ERP System   │
     ├──────────────────────┤
     │  Shortcuts ▸         │
     │  📊 Dashboard        │
     │  📝 Content          │
     │  💰 Revenue          │
     ├──────────────────────┤
     │  Modules ▸           │
     │  👥 HCM              │
     │  🏥 Health           │
     └──────────────────────┘
```

The dark sidebar recedes visually, the white navbar/subnav/content area becomes the focus — exactly like Slack's layout.
