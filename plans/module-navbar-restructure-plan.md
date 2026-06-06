# Plan: Sidebar Module Links + Top Navbar Sub-links

## Goal
- **Sidebar**: Module names are simple clickable links (no dropdowns). Clicking a module navigates to its landing page.
- **Top navbar**: Shows the sub-links for the currently active module.

## Current State
- Sidebar has **dropdown modules** with children (Content Management > Media Library, Categories; Revenue > Permits, Assignments, Reports; etc.)
- Top navbar already has `activeModuleLinks` that shows sub-links based on `activeModuleKey` (detected from `route.path`)
- The `default` case was recently fixed to return `websiteContentLinks` instead of `[]`

## What Changes

### 1. Sidebar: Convert dropdown modules to clickable links
Each module that currently has `children` will become a simple `<router-link>` that navigates to its landing page.

**Module landing pages:**
| Module | Landing Route | Top Navbar Shows |
|--------|--------------|-----------------|
| Dashboard | `/` | Website content links (News, Events, etc.) |
| Content Management | `/website/news` | Website content links |
| Revenue | `/admin/permits` | Permits, Assignments, Reports |
| Human Capital Management | `/admin/hr/employees` | Role-appropriate HCM links |
| Health | `/health/dashboard` | Role-appropriate Health links |

### 2. Sidebar template change
Remove the `<details>` dropdown template branch. All modules render as simple `<router-link>` items.

### 3. Keep existing `activeModuleLinks` logic
The current implementation already works:
- `activeModuleKey` detects module from `route.path`
- `activeModuleLinks` returns the right links for the active module
- `default` returns `websiteContentLinks` (for Dashboard and unmatched paths)

### 4. Keep secondary links accessible
Links like Media Library, Categories, All Content will be added to the top navbar's website content group so they're still accessible.

## Files to Modify
- [`frontend/src/layouts/AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue)

## Sidebar Module Definitions Change
The `modules` computed will change from:
```js
{
  key: 'revenue',
  label: 'Revenue',
  icon: DollarSign,
  visible: true,
  children: [ ... ]  // REMOVED
}
```
To:
```js
{
  key: 'revenue',
  label: 'Revenue',
  icon: DollarSign,
  to: '/admin/permits',  // ADDED - direct link
  visible: true,
  // no children
}
```

## What Stays the Same
- `activeModuleKey` computed (path detection)
- `activeModuleLinks` computed (returns links for active module)
- All module-specific link computeds (revenueLinks, hcmLinks, etc.)
- Top navbar template (already uses `activeModuleLinks`)
- Role-based access
- Dark mode toggle and user menu
