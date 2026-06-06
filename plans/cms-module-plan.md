# CMS Module Enhancement Plan: Persona-Based County Staff Wizard

## 1. Current State Analysis

### Existing Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| **Content model** | ✅ Complete | 9 types (page, news, event, department_notice, press_release, tender, vacancy, department, person), full workflow lifecycle, visibility controls, soft delete |
| **Person model** | ✅ Exists | `Person.js` — name, title, photo_id, bio_en/sw/pok, sort_order, social_links (JSON), content_id FK. **No user_id FK** — not linked to User |
| **User model** | ✅ Exists | `User.js` — email, password_hash, first_name, last_name, department_id, role_id, is_active |
| **Role model** | ✅ Exists | 10 roles: admin, editor, revenue_officer, revenue_clerk, cyber_provider, hr_officer, supervisor, employee, health_officer, health_worker |
| **Department model** | ✅ Exists | name, code, parent_department_id (self-referencing hierarchy) |
| **Admin Person CRUD** | ✅ Exists | `adminController.js` lines 77-183 — listPersons, createPerson, updatePerson, deletePerson. Routes at `adminRoutes.js` lines 17-20 |
| **Public Person API** | ✅ Exists | `publicController.js` lines 393-418 — `getPublicPersons` with optional `?title=` filter, includes photo |
| **Frontend Person list** | ✅ Exists | `ContentListPage.vue` with `contentType: 'person'` — uses CMS content list (not Person model directly) |
| **Frontend Person create** | ✅ Exists | `ContentEditorPage.vue` with `contentType: 'person'` — uses CMS content editor |
| **Frontend Fact manager** | ✅ Exists | `FactManagerPage.vue` — direct CRUD for facts (no workflow) |
| **Frontend HeroSlide manager** | ✅ Exists | `HeroSlideManagerPage.vue` — direct CRUD for hero slides (no workflow) |
| **Frontend UserFormPage** | ✅ Exists | `UserFormPage.vue` — vee-validate + Yup form for creating/editing ERP users |
| **Frontend UserListPage** | ✅ Exists | `UserListPage.vue` — paginated user list with filters |
| **HomePage leadership** | ✅ Exists | `HomePage.vue` lines 143-193 — fetches governor/deputy via `fetchPersons({ title: 'governor' })` |
| **Person ↔ User link** | ❌ Missing | No `user_id` FK on Person model. No way to auto-create a User when creating a Person |
| **Staff directory page** | ❌ Missing | No public "County Staff Directory" page listing all staff by department/role |
| **Person wizard** | ❌ Missing | No streamlined wizard for creating persona-based staff with auto-generated User account |
| **Person admin page** | ❌ Missing | No dedicated `PersonManagerPage.vue` — persons are managed through the generic CMS ContentEditorPage |

### Key Insight: Person vs Content Type 'person'

The system has **two separate concepts** for "person":
1. **`Person` model** (database table `persons`) — used for leadership profiles (Governor, Deputy, CECs). Has multilingual bios, photo, social links, sort order. Managed via `adminController.js` (direct CRUD, no workflow).
2. **Content type `'person'`** — a CMS content entry with type='person'. Managed via `contentController.js` with full workflow lifecycle.

These are linked via `Person.content_id → Content.id` (one-to-one), but there's **no UI** that creates both simultaneously.

## 2. Missing Features Identified

### A. No Person Manager Admin Page
- Persons are currently edited through the generic CMS ContentEditorPage
- No dedicated page showing Person-specific fields (photo, bio, social links, sort order)
- No way to see all persons in a card/grid layout with photos

### B. No Staff Directory Public Page
- HomePage shows Governor and Deputy only
- No `/staff` or `/departments/:id/staff` page listing all county staff
- Citizens cannot browse county leadership, departmental staff, or contact persons

### C. No Persona-Based Staff Wizard
- Creating a "county staff member" requires: creating a Person (via adminController), creating a Content entry (via contentController), creating a User (via userController) — 3 separate operations
- No single wizard that creates all three at once
- No persona templates (e.g., "CEC Member", "Department Director", "Public Relations Officer")

### D. No Person ↔ User Link
- Person model has no `user_id` FK
- A staff member's public profile (Person) is not linked to their ERP login (User)
- Cannot auto-generate login credentials when creating a public profile

### E. No Role-Based Persona Templates
- No predefined persona templates with default titles, descriptions, and role mappings
- E.g., selecting "CEC Member" persona would auto-set title, department, and role

## 3. Proposed Solution: Persona-Based Staff Wizard

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Persona Staff Wizard                    │
├─────────────────────────────────────────────────────────┤
│ Step 1: Select Persona Template                         │
│   - CEC Member (title: "CEC ...", role: employee)      │
│   - Department Director (title: "Director of ...")      │
│   - Public Relations Officer                            │
│   - Custom Persona                                      │
├─────────────────────────────────────────────────────────┤
│ Step 2: Person Details                                  │
│   - Name, Title, Photo (from Media Library)             │
│   - Bio (en/sw/pok), Social Links                       │
│   - Department (from departments table)                 │
│   - Sort Order                                          │
├─────────────────────────────────────────────────────────┤
│ Step 3: User Account (optional)                         │
│   - Email (auto-generated from name if blank)           │
│   - Role (auto-set from persona template)               │
│   - Send Welcome Email toggle                           │
│   - Auto-generate password toggle                       │
├─────────────────────────────────────────────────────────┤
│ Step 4: Review & Create                                 │
│   - Creates Person record                                │
│   - Creates Content entry (type: person) if needed       │
│   - Creates User account (if opted in)                  │
│   - Links Person ↔ User via user_id FK                  │
└─────────────────────────────────────────────────────────┘
```

### Database Changes

**Person model** — add `user_id` FK:

```js
// New field in Person.js
user_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: { model: 'users', key: 'id' },
}
```

**models/index.js** — add association:

```js
Person.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Person, { foreignKey: 'user_id', as: 'profile' });
```

### Backend Changes

#### 1. New Controller: `personaController.js`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/admin/persona/wizard` | POST | Creates Person + optional User + optional Content in one transaction |
| `GET /api/admin/persona/templates` | GET | Returns persona templates with default role mappings |
| `GET /api/admin/persona/staff` | GET | Lists all persons with their linked user accounts (for staff directory management) |

#### 2. New Route: `personaRoutes.js`

```js
router.get('/templates', authenticate, authorize('admin'), personaController.getTemplates);
router.post('/wizard', authenticate, authorize('admin'), personaController.runWizard);
router.get('/staff', authenticate, authorize('admin'), personaController.listStaff);
```

#### 3. Updated `adminRoutes.js` — add persona routes

#### 4. Persona Templates (config)

```js
const PERSONA_TEMPLATES = {
  cec_member: {
    label: 'CEC Member',
    defaultTitle: 'CEC — {department_name}',
    defaultRole: 'employee',
    defaultBioHint: 'Oversees the {department_name} department...',
    createUser: true,
    createContent: true,
  },
  department_director: {
    label: 'Department Director',
    defaultTitle: 'Director of {department_name}',
    defaultRole: 'supervisor',
    defaultBioHint: 'Leads the {department_name} team...',
    createUser: true,
    createContent: true,
  },
  public_relations: {
    label: 'Public Relations Officer',
    defaultTitle: 'Public Relations Officer',
    defaultRole: 'employee',
    defaultBioHint: 'Handles communications and public engagement...',
    createUser: true,
    createContent: true,
  },
  // ... more templates
}
```

### Frontend Changes

#### 1. New Page: `PersonaWizardPage.vue`

Multi-step wizard component:
- Step indicator (4 steps)
- Step 1: Template selection (card grid with persona options)
- Step 2: Person form (name, title, photo, bio, department, social links)
- Step 3: User account form (email, role, password options)
- Step 4: Review summary + Create button
- Uses vee-validate + Yup for validation
- Uses MediaLibraryModal for photo selection

#### 2. New Page: `StaffDirectoryPage.vue` (Admin)

Table/card view of all persons with:
- Photo thumbnail, name, title, department
- Linked user account status (has login / no login)
- Edit/Delete actions
- "Create Staff Member" button → opens wizard

#### 3. New Page: `StaffDirectoryPage.vue` (Public)

Public-facing staff directory:
- Grid of staff cards with photos
- Filter by department
- Click to expand bio and contact info
- Route: `/staff`

#### 4. Router Updates

```js
// Admin routes
{ path: 'admin/staff', name: 'StaffDirectory', component: StaffDirectoryPage, meta: { requiresAdmin: true } },
{ path: 'admin/staff/create', name: 'StaffCreate', component: PersonaWizardPage, meta: { requiresAdmin: true } },

// Public route
{ path: '/staff', name: 'PublicStaffDirectory', component: () => import('../views/public/StaffDirectoryPage.vue') },
```

#### 5. Sidebar Updates (AdminLayout.vue)

Add "Staff Directory" link under Admin-only section:
```js
items.push({
  key: 'staff',
  label: 'Staff Directory',
  icon: UserCircle,
  to: '/admin/staff',
  visible: isAdmin.value,
})
```

#### 6. API Client Updates

```js
// In frontend/src/api/admin.js (or similar)
export async function fetchPersonaTemplates() {
  const { data } = await apiClient.get('/admin/persona/templates')
  return data.templates
}

export async function runPersonaWizard(payload) {
  const { data } = await apiClient.post('/admin/persona/wizard', payload)
  return data
}

export async function fetchStaffDirectory() {
  const { data } = await apiClient.get('/admin/persona/staff')
  return data.staff
}
```

## 4. Implementation Order

| Step | File | Description |
|------|------|-------------|
| 1 | `backend/src/models/Person.js` | Add `user_id` FK field |
| 2 | `backend/src/models/index.js` | Add `Person.belongsTo(User)` + `User.hasOne(Person)` |
| 3 | `backend/src/controllers/personaController.js` | Create new controller with wizard, templates, staff list |
| 4 | `backend/src/routes/personaRoutes.js` | Create new route file |
| 5 | `backend/src/routes/adminRoutes.js` | Mount persona routes |
| 6 | `backend/src/index.js` | Register persona routes |
| 7 | `frontend/src/api/persona.js` | Create API client for persona endpoints |
| 8 | `frontend/src/views/admin/PersonaWizardPage.vue` | Multi-step wizard component |
| 9 | `frontend/src/views/admin/StaffDirectoryPage.vue` | Admin staff directory |
| 10 | `frontend/src/views/public/StaffDirectoryPage.vue` | Public staff directory |
| 11 | `frontend/src/router/index.js` | Add admin + public staff routes |
| 12 | `frontend/src/layouts/AdminLayout.vue` | Add Staff Directory sidebar link |

## 5. Data Flow

```
User clicks "Create Staff Member"
  → PersonaWizardPage loads persona templates from GET /api/admin/persona/templates
  → User fills Step 1 (template), Step 2 (person details), Step 3 (user account)
  → Step 4 shows review summary
  → POST /api/admin/persona/wizard with payload:
      {
        template: 'cec_member',
        person: { name, title, photo_id, bio_en, bio_sw, bio_pok, sort_order, social_links, department_id },
        user: { email, role_id, send_email, auto_generate_password },
        create_content: true,
      }
  → Backend transaction:
      1. Create Person record
      2. Create Content record (type: person) if create_content
      3. Link Person.content_id = Content.id
      4. Create User record if opted in
      5. Link Person.user_id = User.id
      6. Return created Person with nested User + Content
  → Frontend shows success toast + redirects to staff directory
```

## 6. Persona Templates (Full List)

| Key | Label | Default Title Pattern | Default Role | Create User | Create Content |
|-----|-------|----------------------|--------------|-------------|----------------|
| `cec_member` | CEC Member | `CEC — {department_name}` | employee | ✅ | ✅ |
| `department_director` | Department Director | `Director of {department_name}` | supervisor | ✅ | ✅ |
| `public_relations` | Public Relations Officer | `Public Relations Officer` | employee | ✅ | ✅ |
| `county_attorney` | County Attorney | `County Attorney` | employee | ✅ | ✅ |
| `chief_officer` | Chief Officer | `Chief Officer — {department_name}` | employee | ✅ | ✅ |
| `administrative_officer` | Administrative Officer | `Administrative Officer` | employee | ✅ | ✅ |
| `custom` | Custom Persona | (user-defined) | (user-defined) | Optional | Optional |
