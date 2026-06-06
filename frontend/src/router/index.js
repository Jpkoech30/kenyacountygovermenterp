import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  // --- Public Website (West Pokot County) ---
  // These must come BEFORE the admin layout to take priority at root path
  {
    path: '/',
    component: () => import(/* webpackChunkName: "layouts--PublicLayout" */ '../layouts/PublicLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'PublicHome',
        component: () => import(/* webpackChunkName: "public--HomePage" */ '../views/public/HomePage.vue'),
      },
      {
        path: 'about',
        name: 'PublicAbout',
        component: () => import(/* webpackChunkName: "public--AboutPage" */ '../views/public/AboutPage.vue'),
      },
      {
        path: 'departments',
        name: 'PublicDepartments',
        component: () => import(/* webpackChunkName: "public--DepartmentsPage" */ '../views/public/DepartmentsPage.vue'),
      },
      {
        path: 'departments/:slug',
        name: 'PublicDepartmentDetail',
        component: () => import(/* webpackChunkName: "public--DepartmentDetailPage" */ '../views/public/DepartmentDetailPage.vue'),
        props: true,
      },
      {
        path: 'news',
        name: 'PublicNewsList',
        component: () => import(/* webpackChunkName: "public--NewsListPage" */ '../views/public/NewsListPage.vue'),
      },
      {
        path: 'news/:slug',
        name: 'PublicNewsDetail',
        component: () => import(/* webpackChunkName: "public--NewsDetailPage" */ '../views/public/NewsDetailPage.vue'),
        props: true,
      },
      {
        path: 'events',
        name: 'PublicEvents',
        component: () => import(/* webpackChunkName: "public--EventsPage" */ '../views/public/EventsPage.vue'),
      },
      {
        path: 'events/:slug',
        name: 'PublicEventDetail',
        component: () => import(/* webpackChunkName: "public--EventDetailPage" */ '../views/public/EventDetailPage.vue'),
        props: true,
      },
      {
        path: 'tenders',
        name: 'PublicTenders',
        component: () => import(/* webpackChunkName: "public--TendersPage" */ '../views/public/TendersPage.vue'),
      },
      {
        path: 'vacancies',
        name: 'PublicVacancies',
        component: () => import(/* webpackChunkName: "public--VacanciesPage" */ '../views/public/VacanciesPage.vue'),
      },
      {
        path: 'staff',
        name: 'PublicStaffDirectory',
        component: () => import(/* webpackChunkName: "public--StaffDirectoryPage" */ '../views/public/StaffDirectoryPage.vue'),
      },
      {
        path: 'contact',
        name: 'PublicContact',
        component: () => import(/* webpackChunkName: "public--ContactPage" */ '../views/public/ContactPage.vue'),
      },
      {
        path: 'page/:slug',
        name: 'PublicPage',
        component: () => import(/* webpackChunkName: "public--PageView" */ '../views/public/PageView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "auth--LoginPage" */ '../views/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import(/* webpackChunkName: "auth--ResetPasswordPage" */ '../views/ResetPasswordPage.vue'),
    meta: { requiresAuth: false },
  },
  // --- Public: Permit Application & Verification ---
  {
    path: '/apply-permit',
    name: 'ApplyPermit',
    component: () => import(/* webpackChunkName: "permit--ApplyPermitPage" */ '../views/ApplyPermitPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/verify/:permit_id',
    name: 'VerifyPermit',
    component: () => import(/* webpackChunkName: "permit--VerifyPermitPage" */ '../views/VerifyPermitPage.vue'),
    meta: { requiresAuth: false },
  },
  // --- Admin CMS (requires authentication) ---
  {
    path: '/',
    component: () => import(/* webpackChunkName: "layouts--AdminLayout" */ '../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import(/* webpackChunkName: "admin--DashboardPage" */ '../views/DashboardPage.vue'),
      },
      // --- User Management ---
      {
        path: 'admin/users',
        name: 'UserList',
        component: () => import(/* webpackChunkName: "admin--users--UserListPage" */ '../views/admin/UserListPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/users/add',
        name: 'UserAdd',
        component: () => import(/* webpackChunkName: "admin--users--UserFormPage" */ '../views/admin/UserFormPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/users/:id/edit',
        name: 'UserEdit',
        component: () => import(/* webpackChunkName: "admin--users--UserFormPage" */ '../views/admin/UserFormPage.vue'),
        meta: { requiresAdmin: true },
        props: true,
      },
      // --- CMS: Content Management ---
      {
        path: 'cms/content',
        name: 'ContentList',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'cms/content/create',
        name: 'ContentCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'cms/content/:id/edit',
        name: 'ContentEdit',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
      // --- CMS: Media Library ---
      {
        path: 'cms/media',
        name: 'MediaLibrary',
        component: () => import(/* webpackChunkName: "admin--cms--MediaLibraryPage" */ '../views/admin/MediaLibraryPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- CMS: Categories & Tags ---
      {
        path: 'cms/categories',
        name: 'CategoryManager',
        component: () => import(/* webpackChunkName: "admin--cms--CategoryManagerPage" */ '../views/admin/CategoryManagerPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- CMS: Settings ---
      {
        path: 'cms/settings',
        name: 'CmsSettings',
        component: () => import(/* webpackChunkName: "admin--cms--SettingsPage" */ '../views/admin/SettingsPage.vue'),
        meta: { requiresAdmin: true },
      },
      // --- Staff Directory (Persona Wizard) ---
      {
        path: 'admin/staff',
        name: 'StaffDirectory',
        component: () => import(/* webpackChunkName: "admin--staff--StaffDirectoryPage" */ '../views/admin/StaffDirectoryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/staff/create',
        name: 'StaffCreate',
        component: () => import(/* webpackChunkName: "admin--staff--PersonaWizardPage" */ '../views/admin/PersonaWizardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/settings',
        name: 'AdminSettings',
        component: () => import(/* webpackChunkName: "admin--cms--SettingsPage" */ '../views/admin/SettingsPage.vue'),
        meta: { requiresAdmin: true },
      },
      // --- CMS: Navigation Menus ---
      {
        path: 'cms/menus',
        name: 'MenuManager',
        component: () => import(/* webpackChunkName: "admin--cms--MenuManager" */ '../views/admin/MenuManager.vue'),
        meta: { requiresAuth: true },
      },
      // --- Revenue & Business Licensing ---
      {
        path: 'admin/permits',
        name: 'PermitList',
        component: () => import(/* webpackChunkName: "admin--permits--PermitListPage" */ '../views/admin/PermitListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/permits/assign',
        name: 'PermitAssign',
        component: () => import(/* webpackChunkName: "admin--permits--PermitAssignPage" */ '../views/admin/PermitAssignPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/permits/:id',
        name: 'PermitDetail',
        component: () => import(/* webpackChunkName: "admin--permits--PermitDetailPage" */ '../views/admin/PermitDetailPage.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
      // --- Health Facility Management ---
      {
        path: 'health/dashboard',
        name: 'HealthDashboard',
        component: () => import(/* webpackChunkName: "admin--health--DashboardPage" */ '../views/admin/health/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'health/inventory',
        name: 'HealthInventory',
        component: () => import(/* webpackChunkName: "admin--health--InventoryPage" */ '../views/admin/health/InventoryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'health/patients',
        name: 'HealthPatients',
        component: () => import(/* webpackChunkName: "admin--health--PatientsPage" */ '../views/admin/health/PatientsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'health/visits',
        name: 'HealthVisits',
        component: () => import(/* webpackChunkName: "admin--health--VisitsPage" */ '../views/admin/health/VisitsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'health/campaigns',
        name: 'HealthCampaigns',
        component: () => import(/* webpackChunkName: "admin--health--CampaignsPage" */ '../views/admin/health/CampaignsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'health/reports',
        name: 'HealthReports',
        component: () => import(/* webpackChunkName: "admin--health--ReportsPage" */ '../views/admin/health/ReportsPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- Community Health Extension ---
      {
        path: 'community-health/dashboard',
        name: 'CommunityHealthDashboard',
        component: () => import(/* webpackChunkName: "admin--communityHealth--DashboardPage" */ '../views/admin/communityHealth/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/units',
        name: 'CommunityHealthUnits',
        component: () => import(/* webpackChunkName: "admin--communityHealth--CommunityUnitsPage" */ '../views/admin/communityHealth/CommunityUnitsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/assistants',
        name: 'CommunityHealthAssistants',
        component: () => import(/* webpackChunkName: "admin--communityHealth--AssistantsPage" */ '../views/admin/communityHealth/AssistantsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/volunteers',
        name: 'CommunityHealthVolunteers',
        component: () => import(/* webpackChunkName: "admin--communityHealth--VolunteersPage" */ '../views/admin/communityHealth/VolunteersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/households',
        name: 'CommunityHealthHouseholds',
        component: () => import(/* webpackChunkName: "admin--communityHealth--HouseholdsPage" */ '../views/admin/communityHealth/HouseholdsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/visits',
        name: 'CommunityHealthVisits',
        component: () => import(/* webpackChunkName: "admin--communityHealth--VisitsPage" */ '../views/admin/communityHealth/VisitsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/dialogues',
        name: 'CommunityHealthDialogues',
        component: () => import(/* webpackChunkName: "admin--communityHealth--DialoguesPage" */ '../views/admin/communityHealth/DialoguesPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/action-days',
        name: 'CommunityHealthActionDays',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ActionDaysPage" */ '../views/admin/communityHealth/ActionDaysPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/supplies',
        name: 'CommunityHealthSupplies',
        component: () => import(/* webpackChunkName: "admin--communityHealth--SuppliesPage" */ '../views/admin/communityHealth/SuppliesPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'community-health/reports',
        name: 'CommunityHealthReports',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ReportsPage" */ '../views/admin/communityHealth/ReportsPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- CHV-specific routes ---
      {
        path: 'chv/dashboard',
        name: 'ChvDashboard',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ChvDashboardPage" */ '../views/admin/communityHealth/ChvDashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'chv/households',
        name: 'ChvHouseholds',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ChvHouseholdsPage" */ '../views/admin/communityHealth/ChvHouseholdsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'chv/visits',
        name: 'ChvVisits',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ChvVisitsPage" */ '../views/admin/communityHealth/ChvVisitsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'chv/supplies',
        name: 'ChvSupplies',
        component: () => import(/* webpackChunkName: "admin--communityHealth--ChvSuppliesPage" */ '../views/admin/communityHealth/ChvSuppliesPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- Human Capital Management (HR) ---
      {
        path: 'admin/hr/staff',
        redirect: { name: 'StaffDirectory' },
      },
      {
        path: 'admin/hr/staff/create',
        redirect: { name: 'StaffCreate' },
      },
      {
        path: 'admin/hr/employees',
        name: 'EmployeeList',
        component: () => import(/* webpackChunkName: "admin--hr--EmployeeListPage" */ '../views/admin/hr/EmployeeListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/employees/new',
        name: 'EmployeeCreate',
        component: () => import(/* webpackChunkName: "admin--hr--EmployeeCreatePage" */ '../views/admin/hr/EmployeeCreatePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/employees/:id/edit',
        name: 'EmployeeEdit',
        component: () => import(/* webpackChunkName: "admin--hr--EmployeeCreatePage" */ '../views/admin/hr/EmployeeCreatePage.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
      {
        path: 'admin/hr/employees/:id',
        name: 'EmployeeDetail',
        component: () => import(/* webpackChunkName: "admin--hr--EmployeeDetailPage" */ '../views/admin/hr/EmployeeDetailPage.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
      {
        path: 'admin/hr/leave',
        name: 'LeaveManagement',
        component: () => import(/* webpackChunkName: "admin--hr--LeavePage" */ '../views/admin/hr/LeavePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/attendance',
        name: 'AttendanceManagement',
        component: () => import(/* webpackChunkName: "admin--hr--AttendancePage" */ '../views/admin/hr/AttendancePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/recruitment',
        name: 'RecruitmentManagement',
        component: () => import(/* webpackChunkName: "admin--hr--RecruitmentPage" */ '../views/admin/hr/RecruitmentPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/performance',
        name: 'PerformanceManagement',
        component: () => import(/* webpackChunkName: "admin--hr--PerformancePage" */ '../views/admin/hr/PerformancePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/reports',
        name: 'HRReports',
        component: () => import(/* webpackChunkName: "admin--hr--ReportsPage" */ '../views/admin/hr/ReportsPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- HCM: Disciplinary ---
      {
        path: 'admin/hr/disciplinary',
        name: 'DisciplinaryManagement',
        component: () => import(/* webpackChunkName: "admin--hr--DisciplinaryPage" */ '../views/admin/hr/DisciplinaryPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- HCM: Employee Self-Service ---
      {
        path: 'admin/hr/my-leave',
        name: 'MyLeave',
        component: () => import(/* webpackChunkName: "admin--hr--LeavePage" */ '../views/admin/hr/LeavePage.vue'),
        meta: { requiresAuth: true, mode: 'employee' },
      },
      {
        path: 'admin/hr/my-attendance',
        name: 'MyAttendance',
        component: () => import(/* webpackChunkName: "admin--hr--AttendancePage" */ '../views/admin/hr/AttendancePage.vue'),
        meta: { requiresAuth: true, mode: 'employee' },
      },
      {
        path: 'admin/hr/my-performance',
        name: 'MyPerformance',
        component: () => import(/* webpackChunkName: "admin--hr--PerformancePage" */ '../views/admin/hr/PerformancePage.vue'),
        meta: { requiresAuth: true, mode: 'employee' },
      },
      // --- HCM: Supervisor Views ---
      {
        path: 'admin/hr/my-team',
        name: 'MyTeam',
        component: () => import(/* webpackChunkName: "admin--hr--EmployeeListPage" */ '../views/admin/hr/EmployeeListPage.vue'),
        meta: { requiresAuth: true, mode: 'team' },
      },
      {
        path: 'admin/hr/team-leave',
        name: 'TeamLeave',
        component: () => import(/* webpackChunkName: "admin--hr--LeavePage" */ '../views/admin/hr/LeavePage.vue'),
        meta: { requiresAuth: true, mode: 'team' },
      },
      {
        path: 'admin/hr/team-performance',
        name: 'TeamPerformance',
        component: () => import(/* webpackChunkName: "admin--hr--PerformancePage" */ '../views/admin/hr/PerformancePage.vue'),
        meta: { requiresAuth: true, mode: 'team' },
      },
      // --- Revenue: Reports ---
      {
        path: 'admin/permits/reports',
        name: 'PermitReports',
        component: () => import(/* webpackChunkName: "admin--permits--PermitListPage" */ '../views/admin/PermitListPage.vue'),
        meta: { requiresAuth: true, mode: 'reports' },
      },
      // --- Recruitment Extension ---
      {
        path: 'admin/hr/vacancy-requests',
        name: 'VacancyRequests',
        component: () => import(/* webpackChunkName: "admin--hr--VacancyRequestsPage" */ '../views/admin/hr/VacancyRequestsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/shortlist',
        name: 'Shortlist',
        component: () => import(/* webpackChunkName: "admin--hr--ShortlistPage" */ '../views/admin/hr/ShortlistPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/interview-panels',
        name: 'InterviewPanels',
        component: () => import(/* webpackChunkName: "admin--hr--InterviewPanelsPage" */ '../views/admin/hr/InterviewPanelsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin/hr/appointment-letters',
        name: 'AppointmentLetters',
        component: () => import(/* webpackChunkName: "admin--hr--AppointmentLettersPage" */ '../views/admin/hr/AppointmentLettersPage.vue'),
        meta: { requiresAuth: true },
      },
      // --- Website Content Management ---
      // Type-specific create pages (main nav links go here)
      {
        path: 'website/news/create',
        name: 'WebsiteNewsCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'news' },
      },
      {
        path: 'website/events/create',
        name: 'WebsiteEventsCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'event' },
      },
      {
        path: 'website/tenders/create',
        name: 'WebsiteTendersCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'tender' },
      },
      {
        path: 'website/vacancies/create',
        name: 'WebsiteVacanciesCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'vacancy' },
      },
      {
        path: 'website/departments/create',
        name: 'WebsiteDepartmentsCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'department' },
      },
      {
        path: 'website/persons/create',
        name: 'WebsitePersonsCreate',
        component: () => import(/* webpackChunkName: "admin--cms--ContentEditorPage" */ '../views/admin/ContentEditorPage.vue'),
        meta: { requiresAuth: true, contentType: 'person' },
      },
      // List pages (secondary access for browsing existing content)
      {
        path: 'website/news',
        name: 'WebsiteNews',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'news' },
      },
      {
        path: 'website/events',
        name: 'WebsiteEvents',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'event' },
      },
      {
        path: 'website/tenders',
        name: 'WebsiteTenders',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'tender' },
      },
      {
        path: 'website/vacancies',
        name: 'WebsiteVacancies',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'vacancy' },
      },
      {
        path: 'website/departments',
        name: 'WebsiteDepartments',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'department' },
      },
      {
        path: 'website/persons',
        name: 'WebsitePersons',
        component: () => import(/* webpackChunkName: "admin--cms--ContentListPage" */ '../views/admin/ContentListPage.vue'),
        meta: { requiresAuth: true, contentType: 'person' },
      },
      {
        path: 'website/facts',
        name: 'WebsiteFacts',
        component: () => import(/* webpackChunkName: "admin--website--FactManagerPage" */ '../views/admin/website/FactManagerPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'website/hero-slides',
        name: 'WebsiteHeroSlides',
        component: () => import(/* webpackChunkName: "admin--website--HeroSlideManagerPage" */ '../views/admin/website/HeroSlideManagerPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  // --- 404 Catch-All (must be LAST) ---
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "public--NotFoundPage" */ '../views/NotFoundPage.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Navigation guard - handles authentication and role-based access.
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' })
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Check admin-only routes
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
