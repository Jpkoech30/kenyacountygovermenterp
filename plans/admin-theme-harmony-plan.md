# Admin Theme Harmony Plan

## Problem

The admin panel has too many competing background colors stacked vertically:

```
┌─ Blue (#0071E3) ───────────────── Top navbar ──┐
├─ Light gray (#F5F5F7) ─────────── Subnav ──────┤
├─ White (#FFFFFF) ──────────────── Breadcrumb ───┤
├─ Light gray (#F5F5F7) ────────── Content ──────┤
│                                                  │
└──────────────────────────────────────────────────┘
┌─ White (#FFFFFF) ──────────────── Sidebar ──────┐
└──────────────────────────────────────────────────┘
```

This creates visual noise — 3 different background colors in the main content column alone.

## Solution: Simplify to 3 Zones

```
┌─ Blue (#0071E3) ───────────────── Top navbar ──┐
├─ Light gray (#F5F5F7) ─────────── Subnav ──────┤
│  (breadcrumb merged into subnav or content)      │
├─ Light gray (#F5F5F7) ────────── Content ──────┤
│                                                  │
└──────────────────────────────────────────────────┘
┌─ Light gray (#F5F5F7) ────────── Sidebar ──────┐
│  (matches page background, seamless)             │
└──────────────────────────────────────────────────┘
```

## Changes

### 1. Sidebar: Change from white to page-matching background

**File**: [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:794)

| Token | Current | New |
|-------|---------|-----|
| Sidebar background | `bg-base-200` (#FFFFFF) | `bg-base-100` (#F5F5F7) |
| Sidebar border | `border-base-300` (#E8E8ED) | Keep (provides separation from content) |
| Sidebar link text | `text-base-content/70` | `text-base-content` (solid) |
| Sidebar section headers | `text-base-content/50` | `text-base-content/60` |

The sidebar will visually blend with the page background while the border provides clear separation.

### 2. Breadcrumb: Merge into subnav or simplify

**Option A** (recommended): Remove the breadcrumb bar's white background. Change to `bg-transparent` and reduce padding. The breadcrumb sits directly below the subnav with just a small gap.

**File**: [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:764)

| Token | Current | New |
|-------|---------|-----|
| Breadcrumb background | `bg-base-200` (#FFFFFF) | `bg-transparent` |
| Breadcrumb padding | `px-4 lg:px-6 py-2` | `px-4 lg:px-6 pt-1 pb-0` |
| Breadcrumb text | `text-base-content/60` | `text-base-content/50` (more subtle) |

### 3. Sidebar link text: Remove opacity

**File**: [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:831, 927)

Change all `text-base-content/70` on sidebar links to `text-base-content` (solid).

### 4. Sidebar section headers: Slightly higher opacity

**File**: [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:811, 902)

Change `text-base-content/50` to `text-base-content/60` for slightly better readability.

## Visual Result (Light Mode)

```
┌─ #0071E3 (blue) ──────────────── Top navbar ──┐
├─ #F5F5F7 ─────────────────────── Subnav ──────┤
│  Dashboard > Content > News  (subtle, no bg)    │
├─ #F5F5F7 ────────────────────── Content ──────┤
│  ┌─ card ──────────────────────────────────┐   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
┌─ #F5F5F7 ────────────────────── Sidebar ──────┐
│  (seamless with page, border-right separates)   │
└──────────────────────────────────────────────────┘
```

## Visual Result (Dark Mode)

```
┌─ #0A84FF (blue) ──────────────── Top navbar ──┐
├─ #1C1C1E ─────────────────────── Subnav ──────┤
│  Dashboard > Content > News  (subtle, no bg)    │
├─ #1C1C1E ────────────────────── Content ──────┤
└──────────────────────────────────────────────────┘
┌─ #1C1C1E ────────────────────── Sidebar ──────┐
│  (seamless with page)                           │
└──────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:794) | Sidebar: `bg-base-200` → `bg-base-100` |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:764) | Breadcrumb: `bg-base-200` → `bg-transparent`, reduce padding |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:831) | Sidebar link: `text-base-content/70` → `text-base-content` |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:811) | Section header: `text-base-content/50` → `text-base-content/60` |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:902) | Section header: `text-base-content/50` → `text-base-content/60` |
| [`AdminLayout.vue`](../frontend/src/layouts/AdminLayout.vue:927) | Sidebar link: `text-base-content/70` → `text-base-content` |
