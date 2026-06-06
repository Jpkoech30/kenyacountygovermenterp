# Admin Layout: Rounded Zone Separation Plan

## Problem
The admin layout is a stack of flat rectangles (blue navbar → subnav → breadcrumb → content → sidebar) with only `border-b` lines separating them. This creates visual confusion — zones blend together and feel overwhelming.

## Solution
Add rounded corners and subtle shadow/background differentiation to each major zone so the eye can instantly distinguish: "this is the navbar", "this is the subnav", "this is the content area".

## Changes

### 1. Subnav — rounded bottom corners + shadow
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:669)

Change the subnav `<nav>` from flat bar to a card-like strip with rounded bottom corners and a subtle shadow.

```diff
- <nav v-if="activeModuleLinks.length > 0" class="subnav bg-base-100/95 backdrop-blur-md border-b border-base-300">
+ <nav v-if="activeModuleLinks.length > 0" class="subnav bg-base-100/95 backdrop-blur-md border-b border-base-300 rounded-b-xl shadow-sm mx-2">
```

This gives the subnav a slight "floating" card appearance with rounded bottom edges and a small horizontal margin so it doesn't touch the edges.

### 2. Content area — rounded card with shadow
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:784)

Wrap the `<main>` content area in a rounded card with a subtle shadow to visually separate it from the navigation zones.

```diff
- <main class="flex-1 bg-base-100 pb-16 lg:pb-0">
-   <div class="max-w-7xl mx-auto p-4 lg:p-6">
-     <router-view />
-   </div>
- </main>
+ <main class="flex-1 bg-base-100 pb-16 lg:pb-0 px-2">
+   <div class="max-w-7xl mx-auto bg-base-200/50 rounded-xl shadow-sm border border-base-300 p-4 lg:p-6">
+     <router-view />
+   </div>
+ </main>
```

This wraps the content in a slightly lighter card (`base-200/50` — very subtle white overlay) with rounded corners and a border, making it distinct from the page background.

### 3. Sidebar — rounded right edge
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:794)

The sidebar currently has a flat right edge. Add rounded top-right and bottom-right corners.

```diff
- <aside class="bg-base-100 min-h-full w-64 border-r border-base-300 flex flex-col shadow-sm">
+ <aside class="bg-base-100 min-h-full w-64 border-r border-base-300 flex flex-col shadow-sm rounded-r-xl">
```

This gives the sidebar a subtle rounded right edge, softening the transition between sidebar and content.

### 4. Sidebar sections — rounded cards within sidebar
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:809, 851)

The Shortcuts and Modules sections inside the sidebar can have rounded backgrounds to separate them from the sidebar background.

```diff
- <div v-if="pinnedModuleItems.length > 0" class="mb-2">
+ <div v-if="pinnedModuleItems.length > 0" class="mb-2 mx-2 bg-base-200/50 rounded-lg p-1">
```

And for the Modules section:
```diff
- <!-- ── All Modules section ── -->
+ <!-- ── All Modules section ── -->
+ <div class="mx-2 bg-base-200/50 rounded-lg p-1">
```

Note: The Modules section doesn't have a wrapping div currently — the `<button>` and `<ul>` are siblings. We'd need to wrap them in a div, or add the classes to the existing structure.

### 5. Breadcrumb — rounded card
**File**: [`AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue:764)

```diff
- <div v-if="breadcrumbs.length > 1" class="bg-transparent border-b border-base-300 px-4 lg:px-6 pt-1 pb-0">
+ <div v-if="breadcrumbs.length > 1" class="bg-base-200/30 border border-base-300 rounded-lg mx-2 my-1 px-4 lg:px-6 py-1.5">
```

This makes the breadcrumb a small rounded pill/card between subnav and content.

## Visual Hierarchy After Changes

```
┌─────────────────────────────────────────┐
│           Blue Navbar (sticky)          │  ← flat, full-width
├─────────────────────────────────────────┤
│    Subnav (rounded-b-xl, shadow-sm)     │  ← card-like, mx-2
├─────────────────────────────────────────┤
│      Breadcrumb (rounded-lg pill)       │  ← small card, mx-2
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │   Content Card (rounded-xl)     │    │  ← main card with border+shadow
│  │   bg-base-200/50                │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
     Sidebar (rounded-r-xl)
```

Each zone now has a distinct visual container, reducing the overwhelming flat-stack feeling.
