# HR Module Audit & Enhancement Plan

## Problem Statement

> "When as HR I login I should be able to create employees, edit their status. While the functionality are already there, there is no clear what they do. Also the links seem not to have corresponding UIs to complete the functionality."

## Audit Findings

### Staff Directory vs Employees — Duplicate Overlap

| Aspect | Staff Directory (`/admin/staff`) | Employees (`/admin/hr/employees`) |
|--------|----------------------------------|-----------------------------------|
| **Data source** | `Person` model (public-facing profiles with user accounts) | `Employee` model (HR records with employment details) |
| **Backend** | `personaController.listStaff` — Persons with linked User accounts | `hrRoutes.js` — Full CRUD with employment history, leave, attendance |
| **Frontend** | Card grid with photo, name, title, department, account status | Table with name, ID, department, position, type, status |
| **Create** | PersonaWizardPage (creates Person + optional User) | EmployeeCreatePage (planned — creates Employee record) |
| **Use case** | Public website staff listing + login account management | HR operations: payroll, leave, attendance, performance |
| **Overlap** | Both show people with names, departments, and positions | ❌ Different models, different purposes |

**Conclusion**: They serve different purposes. Staff Directory = public-facing profiles + user accounts. Employees = HR operational records. However, the sidebar had both listed under HCM which caused confusion. The fix is to keep Employees under HCM and move Staff Directory to a separate "User Accounts" section or keep it under HCM with clear labeling.

### 1. Employee Creation — Missing UI

| Item | Status |
|------|--------|
| Route `/admin/hr/employees/new` | ✅ Exists (line 365-369) |
| Component loaded | ❌ Points to `EmployeeListPage.vue` instead of a create form |
| Backend `POST /api/hr/employees` | ✅ Exists (line 467-482) |
| hrStore `createEmployee()` | ✅ Exists (line 87-99) |

**Fix**: Create `EmployeeCreatePage.vue` with a full form (personal info, employment details, statutory fields).

### 2. Employee Status Changes — No Confirmation UX

| Item | Status |
|------|--------|
| Suspend button | ✅ Exists in `EmployeeDetailPage.vue` (line 112) |
| Terminate button | ✅ Exists (line 113) |
| Retire button | ✅ Exists (line 114) |
| Uses `prompt()` for reason | ❌ Ugly, no modal, no validation |
| Backend endpoints | ✅ All 3 exist (suspend/terminate/retire) |

**Fix**: Replace `prompt()` with a DaisyUI modal that has a textarea for reason, confirmation checkbox, and loading state.

### 3. Employee List — No Inline Actions

| Item | Status |
|------|--------|
| View button | ✅ Exists |
| Edit button | ❌ Missing |
| Quick status change | ❌ Missing |
| Bulk actions | ❌ Missing |

**Fix**: Add Edit button, quick-status dropdown, and bulk action bar.

### 4-7. Other HR Pages — Already Functional

| Page | Status |
|------|--------|
| LeavePage | ✅ Approve/reject with modal |
| AttendancePage | ✅ Check-in/out via AttendanceClock |
| PerformancePage | ✅ Create/view reviews with modals |
| DisciplinaryPage | ✅ Create/view cases with modals |
| ReportsPage | ✅ Headcount/leave/turnover reports |
| Recruitment pages | ✅ All functional |

## Proposed Changes

### Change 1: Create `EmployeeCreatePage.vue`

Full create form with:
- Personal info: first_name, last_name, national_id, birth_date, gender, marital_status
- Contact: phone, email
- Employment: department (dropdown), position (dropdown), employment_type, supervisor (dropdown)
- Statutory: kra_pin, nssf_no, nhif_no, bank_account
- Contract: start_date, end_date (optional)
- Photo upload (media library modal)

### Change 2: Add Status Change Modal to `EmployeeDetailPage.vue`

Replace `prompt()` with DaisyUI modal:
```html
<input type="checkbox" id="status-action-modal" class="modal-toggle" v-model="showStatusModal" />
<div class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">{{ statusAction }} Employee</h3>
    <textarea v-model="statusReason" class="textarea textarea-bordered w-full" placeholder="Reason..."></textarea>
    <div class="modal-action">
      <button class="btn" @click="showStatusModal = false">Cancel</button>
      <button class="btn" :class="statusBtnClass" @click="confirmStatusAction" :disabled="!statusReason">
        Confirm {{ statusAction }}
      </button>
    </div>
  </div>
</div>
```

### Change 3: Add Inline Actions to `EmployeeListPage.vue`

- Add "Edit" button per row → navigates to `/admin/hr/employees/:id/edit`
- Add quick-status dropdown per row (active/suspended/terminated/retired)

### Change 4: Update Router

- Point `/admin/hr/employees/new` to new `EmployeeCreatePage.vue`
- Add `/admin/hr/employees/:id/edit` route pointing to `EmployeeCreatePage.vue` with edit mode

## Acceptance Criteria

1. HR admin can create an employee via a proper form with all fields
2. HR admin can change employee status via a modal (not prompt)
3. Employee list has inline edit and quick-status actions
4. All HR sidebar links navigate to pages with complete functional UIs
5. No `prompt()` or `confirm()` dialogs in HR module
6. Staff Directory and Employees are clearly differentiated in the sidebar
