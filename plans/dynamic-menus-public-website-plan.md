# West Pokot CMS – Public Website Integration (Dynamic Menus & Content Display)

The public website must display all CMS‑published content without any hardcoded links. Administrators must be able to manage the main navigation menu (add, edit, delete, reorder links) through the CMS admin panel. Additionally, the existing **AI Content Assistant** (draft generation from URL/file, grammar check, translation, SEO suggestions) must be integrated into the page creation workflow so admins can generate page content using AI when adding menu items.

---

## 1. Backend (CMS) Extensions

### 1.1 Database Tables

**`menus` table:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK | Auto-increment |
| `name` | VARCHAR(100) | e.g., "Main Menu", "Footer Menu" |
| `location` | VARCHAR(50) | e.g., `"header"`, `"footer"` |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**`menu_items` table:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK | Auto-increment |
| `menu_id` | INT FK → `menus.id` | ON DELETE CASCADE |
| `parent_id` | INT FK → `menu_items.id` | NULLABLE, for sub‑menus/dropdowns |
| `title` | JSON | Multilingual: `{"en": "...", "sw": "...", "pok": "..."}` |
| `type` | ENUM(`'page'`, `'category'`, `'custom_url'`, `'external_link'`) | Determines how the link is resolved |
| `target_id` | INT | FK to `contents.id` (if `type='page'`) or `taxonomies.id` (if `type='category'`); NULL otherwise |
| `url` | VARCHAR(255) | Used when `type='custom_url'` or `'external_link'` |
| `sort_order` | INT | For drag‑drop ordering |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

### 1.2 Sequelize Models

- **`backend/src/models/Menu.js`** — Define `Menu` model with `name`, `location`. HasMany `MenuItems`.
- **`backend/src/models/MenuItem.js`** — Define `MenuItem` model with `menu_id`, `parent_id`, `title` (JSON), `type` (enum), `target_id`, `url`, `sort_order`, `is_active`. BelongsTo `Menu`, belongsTo self (`parent_id`).

### 1.3 API Endpoints

**Public endpoints (no auth):**
- `GET /api/public/menus?location=header&locale=en` — Returns menu items as a nested tree (parent → children) for the given location. The `title` field returns the locale-specific value. Children are sorted by `sort_order`.

**Admin endpoints (auth + role required):**
- `GET /api/admin/menus` — List all menus.
- `POST /api/admin/menus` — Create a new menu.
- `PUT /api/admin/menus/:id` — Update a menu.
- `DELETE /api/admin/menus/:id` — Delete a menu (cascades to items).
- `GET /api/admin/menus/:id/items` — List items for a menu (flat list with `parent_id` for tree rendering).
- `POST /api/admin/menus/:id/items` — Create a menu item.
- `PUT /api/admin/menu-items/:id` — Update a menu item.
- `DELETE /api/admin/menu-items/:id` — Delete a menu item.
- `PUT /api/admin/menus/:id/reorder` — Accepts `{ items: [{ id, sort_order, parent_id }] }` to batch-update ordering and parent assignments.

**Supporting endpoints (for admin dropdowns):**
- `GET /api/admin/published-pages?locale=en` — Returns `[{ id, slug, title }]` for all published `type='page'` content.
- `GET /api/admin/categories?locale=en` — Returns `[{ id, slug, name }]` for all taxonomies of type `'category'`.

### 1.4 Admin UI (CMS)

Add a new **"Menus"** section under **"Website Content"** in the sidebar.

**MenuManager.vue** — List all menus with create/edit/delete buttons.
- Clicking a menu opens its item editor.

**MenuItemEditor.vue** — For a single menu:
- Displays items as a sortable list (use `sortablejs` or up/down arrow buttons).
- Each item row shows: title (in default locale), type badge, parent indicator, active toggle, edit/delete buttons.
- "Add Item" button opens a modal/drawer.

**MenuItemForm.vue** — Modal/drawer form:
- **Type** dropdown: Page, Category, Custom URL, External Link.
- When **Page** is selected: a searchable select/dropdown fetches from `/api/admin/published-pages?locale=...`.
- When **Category** is selected: a searchable select/dropdown fetches from `/api/admin/categories?locale=...`.
- When **Custom URL** or **External Link** is selected: a text input for URL appears.
- **Title** fields: three inputs for `en`, `sw`, `pok` (auto-filled from page/category title if type is Page/Category, but editable).
- **Parent item** dropdown: lists other items in the same menu (for nesting).
- **Active** toggle.
- **Save** button.

All UI uses **DaisyUI** components (buttons, modals, selects, inputs, toggles).

---

## 2. AI Content Assistant Integration in Page Creation Workflow

When an admin creates a menu item of type **Page**, they need a way to first **create the page content** if it doesn't exist yet. The workflow should be:

### 2.1 "Create New Page" Option in MenuItemForm

When the admin selects **Type: Page**, the page select dropdown should include an option at the top: **"+ Create New Page with AI"**.

Selecting this option opens a **Page Creation Wizard** that leverages the existing AI Content Assistant:

### 2.2 Page Creation Wizard (AIPageCreator.vue)

A multi-step modal/drawer that reuses the existing AI infrastructure:

**Step 1 — Source Selection:**
- Option A: **Generate from URL** — Enter a URL, the system scrapes it and generates a draft (uses existing `POST /api/ai/content-assistant/from-url`).
- Option B: **Upload a file** — Upload a TXT/PDF/DOCX file, the system extracts text and generates a draft (uses existing `POST /api/ai/content-assistant/from-file-upload`).
- Option C: **Start from scratch** — Skip AI generation, go directly to manual entry.

**Step 2 — AI Draft Generation (if Option A or B):**
- Shows loading state with the existing `AIActionModal.vue` component.
- Displays the generated draft (title, body, excerpt) with cost estimate.
- Admin can **Accept** the draft or **Cancel** to try again.

**Step 3 — Content Editor (reuses existing ContentEditor.vue):**
- Pre-filled with AI-generated content (if accepted) or empty (if starting from scratch).
- Admin can edit title, body, excerpt, featured image, categories, SEO metadata.
- **AI Assist buttons** in the editor toolbar (reusing existing AI features):
  - **Grammar Check** — `POST /api/ai/grammar`
  - **Translate** — `POST /api/ai/translate` (for multilingual titles)
  - **Suggest Tags** — `POST /api/ai/suggest-tags`
  - **Suggest SEO** — `POST /api/ai/suggest-seo`
  - **Improve Writing** — `POST /api/ai/improve-writing`
- Each AI action opens the existing `AIActionModal.vue` to show results.

**Step 4 — Save & Link:**
- Admin clicks **"Save Page & Add to Menu"**.
- The page is created via `POST /api/admin/content` (existing endpoint).
- The menu item is automatically created with `type='page'` and `target_id` set to the new page's ID.
- The wizard closes and the menu item appears in the list.

### 2.3 Reusing Existing Components

The following existing components and APIs are reused directly:
- **`AIActionModal.vue`** — For displaying AI results (grammar, translate, tags, SEO, draft generation).
- **`ContentEditor.vue`** — For editing page content (title, body, excerpt, featured image, categories).
- **`POST /api/ai/grammar`** — Grammar check.
- **`POST /api/ai/translate`** — Translation.
- **`POST /api/ai/suggest-tags`** — Tag suggestions.
- **`POST /api/ai/suggest-seo`** — SEO metadata suggestions.
- **`POST /api/ai/improve-writing`** — Writing improvement.
- **`POST /api/ai/content-assistant/from-url`** — Draft from URL.
- **`POST /api/ai/content-assistant/from-file-upload`** — Draft from file upload.
- **`POST /api/admin/content`** — Create content (existing endpoint in contentController.js).
- **`useToast` composable** — For success/error feedback.

---

## 3. Public Website Updates

### 3.1 Dynamic Menu in AppHeader.vue

- Create a Pinia store **`frontend/src/stores/menu.js`**:
  - `fetchMenu(location, locale)` — calls `GET /api/public/menus?location=...&locale=...`, caches result.
  - `menu` ref — the cached menu items tree.
  - `loading` ref — for skeleton display.

- Update **`frontend/src/components/public/AppHeader.vue`**:
  - On mount, call `menuStore.fetchMenu('header', currentLocale)`.
  - Render the menu as a DaisyUI `<ul>` with dropdown classes:
    - Top-level items with no children → simple `<li><a>`.
    - Top-level items with children → DaisyUI dropdown (`dropdown`, `dropdown-hover`, `dropdown-content`).
    - Mobile: collapsible hamburger menu.
  - Show a loading skeleton (pulsing bars) while `menuStore.loading` is true.
  - The logo/home link can remain hardcoded.

- **Link resolution logic** (in a helper or computed):
  - `type='page'` → `/page/:slug` (fetch slug from content via a lookup map).
  - `type='category'` → `/category/:slug` (fetch slug from taxonomy).
  - `type='custom_url'` → the `url` value directly (e.g., `/news`, `/contact`).
  - `type='external_link'` → the `url` value (full URL, opens in new tab with `rel="noopener noreferrer"`).

### 3.2 Dynamic Page Route

- Create **`frontend/src/views/public/PageView.vue`**:
  - Fetches content by slug from `GET /api/public/content/:slug`.
  - If `content.type === 'page'`, renders the page title, body, and metadata.
  - Uses the same content rendering approach as `NewsDetailView.vue` (rich text, featured image, etc.).
  - Shows a 404 message if content not found or not a page type.

- Update **`frontend/src/router/index.js`**:
  - Add route: `{ path: '/page/:slug', name: 'PageView', component: () => import('@/views/public/PageView.vue') }`.

### 3.3 Category Page Route (Optional for MVP)

- Create **`frontend/src/views/public/CategoryView.vue`**:
  - Fetches content list filtered by category slug from `GET /api/public/content?category=:slug&locale=...`.
  - Renders a paginated list of content cards.

- Add route: `{ path: '/category/:slug', name: 'CategoryView', component: () => import('@/views/public/CategoryView.vue') }`.

### 3.4 Existing Routes Compatibility

Keep existing routes (`/news`, `/events`, `/departments`, `/contact`, `/verify`) unchanged. These can be added as menu items manually by choosing **Custom URL** type and entering the path (e.g., `/news`).

---

## 4. Workflow Example

1. Admin logs into CMS, navigates to **Website Content → Menus**.
2. Clicks **"Main Menu"** to open the item editor.
3. Clicks **"Add Item"**.
4. Selects **Type: Page**, then clicks **"+ Create New Page with AI"**.
5. **Page Creation Wizard** opens:
   - Enters a URL (e.g., a county government website page about agriculture).
   - Clicks **"Generate Draft"**.
   - AI scrapes the URL and generates a draft with title, body, excerpt.
   - Reviews the draft in `AIActionModal.vue`, clicks **Accept**.
   - Content editor opens pre-filled with the draft.
   - Uses **Grammar Check** AI button to polish the text.
   - Uses **Suggest SEO** to generate meta description and keywords.
   - Edits the title and adds a featured image.
   - Clicks **"Save Page & Add to Menu"**.
6. The page is created and the menu item is automatically linked.
7. Admin sets sort order (drag drop), optionally sets a parent for dropdown.
8. Saves.
9. Public site immediately shows the new link in the header navigation.

---

## 5. Acceptance Criteria

- [ ] Admin can create, edit, delete, and reorder menus.
- [ ] Admin can create, edit, delete, and reorder menu items within a menu.
- [ ] Menu items support parent/child nesting for dropdown sub-menus.
- [ ] When adding a Page-type menu item, admin can create a new page using AI Content Assistant (from URL or file upload).
- [ ] AI-generated drafts can be reviewed, accepted, and edited before saving.
- [ ] Existing AI features (grammar check, translate, suggest tags, suggest SEO, improve writing) are available in the page editor.
- [ ] Public website menu updates immediately after save (no cache, or short cache).
- [ ] All published pages are accessible via `/page/:slug`.
- [ ] The menu uses DaisyUI styling: horizontal on desktop, collapsible hamburger on mobile.
- [ ] No hardcoded links remain in `AppHeader.vue` (except the logo/home link).
- [ ] Loading skeleton is shown while menu is being fetched.
- [ ] Multilingual titles are stored and displayed correctly based on the current locale.

---

## 6. Files to Generate/Modify

### Backend (new files)
| File | Purpose |
|------|---------|
| `backend/src/models/Menu.js` | Menu model |
| `backend/src/models/MenuItem.js` | MenuItem model |
| `backend/src/controllers/menuController.js` | Public + admin CRUD controllers |
| `backend/src/routes/menuRoutes.js` | Route definitions |
| `backend/src/seeders/menuSeeder.js` | Optional: seed default menus |

### Backend (modified files)
| File | Change |
|------|--------|
| `backend/src/models/index.js` | Import and associate Menu + MenuItem models |
| `backend/src/routes/index.js` (or equivalent) | Mount menu routes |
| `backend/src/controllers/publicController.js` | Add `getPublicMenus` handler |

### Frontend — CMS Admin (new files)
| File | Purpose |
|------|---------|
| `frontend/src/views/admin/MenuManager.vue` | List all menus |
| `frontend/src/views/admin/MenuItemEditor.vue` | Sortable list of items for one menu |
| `frontend/src/views/admin/MenuItemForm.vue` | Add/edit item modal |
| `frontend/src/views/admin/AIPageCreator.vue` | Multi-step wizard: AI draft → edit → save & link to menu |

### Frontend — CMS Admin (modified files)
| File | Change |
|------|--------|
| `frontend/src/layouts/AdminLayout.vue` | Add "Menus" link under "Website Content" |
| `frontend/src/router/index.js` | Add admin menu routes |
| `frontend/src/api/admin.js` | Add API functions for menu CRUD |

### Frontend — Public Website (new files)
| File | Purpose |
|------|---------|
| `frontend/src/stores/menu.js` | Pinia store for menu fetching/caching |
| `frontend/src/views/public/PageView.vue` | Dynamic page renderer |
| `frontend/src/views/public/CategoryView.vue` | Category listing (optional MVP) |

### Frontend — Public Website (modified files)
| File | Change |
|------|--------|
| `frontend/src/components/public/AppHeader.vue` | Replace hardcoded links with dynamic menu |
| `frontend/src/router/index.js` | Add `/page/:slug` and `/category/:slug` routes |

---

## 7. Implementation Notes

- Use `sequelize.sync()` — the migration will be handled by model sync (existing pattern in the project).
- The `title` JSON field in `MenuItem` should be stored as a JSON string. Sequelize `DataTypes.JSON` handles this.
- For the public menu endpoint, build the tree in the controller using a recursive function or by grouping items by `parent_id`.
- The admin menu item editor should load all items for a menu as a flat list and let the frontend build the tree for display.
- Drag-and-drop: use `sortablejs` via `npm install sortablejs` for a smooth experience, or implement simple up/down buttons as a fallback.
- All DaisyUI components should use the existing project theme (no custom CSS beyond what DaisyUI provides).
- The menu store should cache the menu for the session (no need to refetch on every navigation), but provide a `refresh()` method for hard reloads.
- The `AIPageCreator.vue` wizard should reuse existing `AIActionModal.vue` and `ContentEditor.vue` components rather than duplicating their logic.
- The "Save Page & Add to Menu" action should call `POST /api/admin/content` first, then `POST /api/admin/menus/:id/items` with the new content's ID as `target_id`.
