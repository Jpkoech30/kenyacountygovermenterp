# Staff Directory — HR Integration & Photo Fix Plan

## Issues Found

### 1. Photo URL broken (3 files)
All use `/storage/media/` prefix but backend serves at `/media/`:
- [`admin StaffDirectoryPage.vue:66`](../frontend/src/views/admin/StaffDirectoryPage.vue:66) — `getPhotoUrl()`
- [`public StaffDirectoryPage.vue:66`](../frontend/src/views/public/StaffDirectoryPage.vue:66) — `getPhotoUrl()`
- [`HomePage.vue:154,176`](../frontend/src/views/public/HomePage.vue:154) — governor/deputy photo URLs

The wizard at [`PersonaWizardPage.vue:287`](../frontend/src/views/admin/PersonaWizardPage.vue:287) already uses `/media/` correctly.

### 2. Staff Directory misplaced in sidebar
Currently a standalone admin-only item at [`AdminLayout.vue:559-568`](../frontend/src/layouts/AdminLayout.vue:559). Should be under HCM module, visible to admin + hr_officer.

### 3. No HCM subnav when on Staff Directory
[`activeModuleKey`](../frontend/src/layouts/AdminLayout.vue:309) doesn't match `/admin/staff`, so no subnav links appear.

### 4. No Staff Directory link in HCM subnav
[`hcmLinks`](../frontend/src/layouts/AdminLayout.vue:352) doesn't include Staff Directory.

### 5. No HR route alias
No `/admin/hr/staff` route — Staff Directory feels disconnected from HR module.

## Implementation Order (8 steps)

### Step 1: Fix photo URL in admin StaffDirectoryPage.vue
Change `getPhotoUrl()` from `/storage/media/` to `/media/`.

### Step 2: Fix photo URL in public StaffDirectoryPage.vue
Change `getPhotoUrl()` from `/storage/media/` to `/media/`.

### Step 3: Fix photo URL in HomePage.vue
Change governor/deputy photo URLs from `/storage/media/` to `/media/`.

### Step 4: Move Staff Directory into HCM sidebar section
Remove standalone block (lines 559-568), add inside HCM block (after line 545).

### Step 5: Add `/admin/staff` to activeModuleKey
Map it to `'hcm'` so HCM subnav appears.

### Step 6: Add Staff Directory to hcmLinks
Visible to admin + hr_officer, with `UserCircle` icon.

### Step 7: Add HR route alias
Add `/admin/hr/staff` redirecting to `/admin/staff`.

### Step 8: Verify build + restart PM2
