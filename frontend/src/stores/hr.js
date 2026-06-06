import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '../api/axios';

export const useHrStore = defineStore('hr', () => {
  // Recruitment Extension State
  const vacancyRequests = ref([]);
  const interviewPanels = ref([]);
  const appointmentLetters = ref([]);
  const dashboardMetrics = ref({
    pendingRequests: 0,
    activeVacancies: 0,
    totalApplications: 0,
    shortlistedCount: 0,
    upcomingInterviews: 0,
    draftLetters: 0,
  });
  // State
  const employees = ref([]);
  const currentEmployee = ref(null);
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const loading = ref(false);
  const error = ref(null);

  // Leave
  const leaveRequests = ref([]);
  const teamLeaveRequests = ref([]);

  // Attendance
  const attendanceLogs = ref([]);

  // Recruitment
  const vacancies = ref([]);
  const applications = ref([]);
  const currentApplication = ref(null);

  // Performance
  const performanceReviews = ref([]);
  const teamReviews = ref([]);

  // Disciplinary
  const disciplinaryCases = ref([]);

  // Reports
  const headcountReport = ref([]);
  const leaveUsageReport = ref([]);
  const turnoverReport = ref(null);

  // Employee Self-Service
  const myProfile = ref(null);
  const myLeaveBalance = ref(null);

  // ==========================================================================
  // Employee Management
  // ==========================================================================

  async function fetchEmployees(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/employees', { params });
      employees.value = response.data.employees;
      pagination.value = response.data.pagination;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch employees';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEmployee(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/hr/employees/${id}`);
      currentEmployee.value = response.data.employee;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createEmployee(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/employees', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateEmployee(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/hr/employees/${id}`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addEmploymentHistory(employeeId, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/employees/${employeeId}/employment-history`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to add employment history';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function suspendEmployee(id, reason) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/employees/${id}/suspend`, { reason });
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to suspend employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function terminateEmployee(id, reason) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/employees/${id}/terminate`, { reason });
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to terminate employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function retireEmployee(id, reason) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/employees/${id}/retire`, { reason });
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to retire employee';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Employee Self-Service
  // ==========================================================================

  async function fetchMyProfile() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/employees/me');
      myProfile.value = response.data.employee;
      myLeaveBalance.value = response.data.leaveBalance;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch profile';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateMyProfile(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put('/hr/employees/me', data);
      myProfile.value = response.data.employee;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update profile';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Leave Management
  // ==========================================================================

  async function fetchMyLeaveRequests(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/leave/requests', { params });
      leaveRequests.value = response.data.leaveRequests;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch leave requests';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function submitLeaveRequest(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/leave/request', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to submit leave request';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTeamLeaveRequests(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/leave/team-requests', { params });
      teamLeaveRequests.value = response.data.leaveRequests;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch team leave requests';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function approveLeave(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/leave/${id}/approve`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to approve leave';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function rejectLeave(id, reason) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/leave/${id}/reject`, { reason });
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reject leave';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Attendance
  // ==========================================================================

  async function fetchMyAttendance(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/attendance/me', { params });
      attendanceLogs.value = response.data.logs;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch attendance';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkIn(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/attendance/check-in', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to check in';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkOut(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/attendance/check-out', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to check out';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Recruitment
  // ==========================================================================

  async function fetchVacancies(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/vacancies', { params });
      vacancies.value = response.data.vacancies;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch vacancies';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createVacancy(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/vacancies', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create vacancy';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateVacancy(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/hr/vacancies/${id}`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update vacancy';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchApplications(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/applications', { params });
      applications.value = response.data.applications;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch applications';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchApplication(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/hr/applications/${id}`);
      currentApplication.value = response.data.application;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch application';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateApplicationStatus(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/hr/applications/${id}/status`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update application status';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Performance Reviews
  // ==========================================================================

  async function fetchMyPerformance() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/performance/me');
      performanceReviews.value = response.data.reviews;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch performance reviews';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTeamReviews() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/performance/team-reviews');
      teamReviews.value = response.data.reviews;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch team reviews';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createPerformanceReview(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/performance', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create performance review';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function submitPerformanceReview(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/hr/performance/${id}/submit`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to submit performance review';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Disciplinary Cases
  // ==========================================================================

  async function fetchDisciplinaryCases(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/disciplinary', { params });
      disciplinaryCases.value = response.data.cases;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch disciplinary cases';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDisciplinaryCase(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/hr/disciplinary', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create disciplinary case';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDisciplinaryCase(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/hr/disciplinary/${id}`, data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update disciplinary case';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ==========================================================================
  // Reports
  // ==========================================================================

  async function fetchHeadcountReport() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/reports/headcount');
      headcountReport.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch headcount report';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLeaveUsageReport() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/reports/leave-usage');
      leaveUsageReport.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch leave usage report';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTurnoverReport(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/hr/reports/turnover', { params });
      turnoverReport.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch turnover report';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================
  // Recruitment Extension — Vacancy Requests
  // ============================================================

  async function fetchVacancyRequests() {
    loading.value = true;
    try {
      const res = await api.get('/hr/vacancy-requests');
      vacancyRequests.value = res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch vacancy requests';
    } finally {
      loading.value = false;
    }
  }

  async function createVacancyRequest(data) {
    loading.value = true;
    try {
      const res = await api.post('/hr/vacancy-requests', data);
      await fetchVacancyRequests();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create vacancy request';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function approveVacancyRequest(id, notes) {
    try {
      const res = await api.put(`/hr/vacancy-requests/${id}/approve`, { notes });
      await fetchVacancyRequests();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to approve vacancy request';
      throw err;
    }
  }

  async function rejectVacancyRequest(id, reason) {
    try {
      const res = await api.put(`/hr/vacancy-requests/${id}/reject`, { reason });
      await fetchVacancyRequests();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reject vacancy request';
      throw err;
    }
  }

  // ============================================================
  // Recruitment Extension — Shortlisting
  // ============================================================

  async function shortlistApplication(id, data) {
    try {
      const res = await api.put(`/hr/applications/${id}/shortlist`, data);
      await fetchApplications({ vacancy_id: data.vacancy_id });
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to shortlist application';
      throw err;
    }
  }

  async function finalizeShortlist(vacancyId) {
    try {
      const res = await api.post(`/hr/vacancies/${vacancyId}/finalize-shortlist`);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to finalize shortlist';
      throw err;
    }
  }

  // ============================================================
  // Recruitment Extension — Interview Panels
  // ============================================================

  async function fetchInterviewPanels() {
    loading.value = true;
    try {
      const res = await api.get('/hr/interview-panels');
      interviewPanels.value = res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch interview panels';
    } finally {
      loading.value = false;
    }
  }

  async function createInterviewPanel(data) {
    loading.value = true;
    try {
      const res = await api.post('/hr/interview-panels', data);
      await fetchInterviewPanels();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create interview panel';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addPanelMember(panelId, userId, role) {
    try {
      const res = await api.post(`/hr/interview-panels/${panelId}/members`, { user_id: userId, role });
      await fetchInterviewPanels();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add panel member';
      throw err;
    }
  }

  async function removePanelMember(memberId) {
    try {
      const res = await api.delete(`/hr/interview-panel-members/${memberId}`);
      await fetchInterviewPanels();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to remove panel member';
      throw err;
    }
  }

  // ============================================================
  // Recruitment Extension — Interview Scoring
  // ============================================================

  async function submitInterviewScore(data) {
    try {
      const res = await api.post('/hr/interview-scores', data);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to submit interview score';
      throw err;
    }
  }

  async function fetchApplicationScores(applicationId) {
    try {
      const res = await api.get(`/hr/applications/${applicationId}/scores`);
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch scores';
      throw err;
    }
  }

  // ============================================================
  // Recruitment Extension — Appointment Letters
  // ============================================================

  async function fetchAppointmentLetters() {
    loading.value = true;
    try {
      const res = await api.get('/hr/appointment-letters');
      appointmentLetters.value = res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch appointment letters';
    } finally {
      loading.value = false;
    }
  }

  async function generateAppointmentLetter(applicationId) {
    loading.value = true;
    try {
      const res = await api.post(`/hr/applications/${applicationId}/generate-letter`);
      await fetchAppointmentLetters();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to generate appointment letter';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function issueAppointmentLetter(letterId) {
    try {
      const res = await api.put(`/hr/appointment-letters/${letterId}/issue`);
      await fetchAppointmentLetters();
      return res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to issue appointment letter';
      throw err;
    }
  }

  // ============================================================
  // Recruitment Extension — Dashboard Metrics
  // ============================================================

  async function fetchRecruitmentDashboard() {
    try {
      const res = await api.get('/hr/recruitment/dashboard');
      dashboardMetrics.value = res.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard metrics';
    }
  }

  return {
    // State
    employees,
    currentEmployee,
    pagination,
    loading,
    error,
    leaveRequests,
    teamLeaveRequests,
    attendanceLogs,
    vacancies,
    applications,
    currentApplication,
    performanceReviews,
    teamReviews,
    disciplinaryCases,
    headcountReport,
    leaveUsageReport,
    turnoverReport,
    myProfile,
    myLeaveBalance,
    // Recruitment Extension
    vacancyRequests,
    interviewPanels,
    appointmentLetters,
    dashboardMetrics,
    // Employee Management
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    addEmploymentHistory,
    suspendEmployee,
    terminateEmployee,
    retireEmployee,
    // Self-Service
    fetchMyProfile,
    updateMyProfile,
    // Leave
    fetchMyLeaveRequests,
    submitLeaveRequest,
    fetchTeamLeaveRequests,
    approveLeave,
    rejectLeave,
    // Attendance
    fetchMyAttendance,
    checkIn,
    checkOut,
    // Recruitment
    fetchVacancies,
    createVacancy,
    updateVacancy,
    fetchApplications,
    fetchApplication,
    updateApplicationStatus,
    // Recruitment Extension
    fetchVacancyRequests,
    createVacancyRequest,
    approveVacancyRequest,
    rejectVacancyRequest,
    shortlistApplication,
    finalizeShortlist,
    fetchInterviewPanels,
    createInterviewPanel,
    addPanelMember,
    removePanelMember,
    submitInterviewScore,
    fetchApplicationScores,
    fetchAppointmentLetters,
    generateAppointmentLetter,
    issueAppointmentLetter,
    fetchRecruitmentDashboard,
    // Performance
    fetchMyPerformance,
    fetchTeamReviews,
    createPerformanceReview,
    submitPerformanceReview,
    // Disciplinary
    fetchDisciplinaryCases,
    createDisciplinaryCase,
    updateDisciplinaryCase,
    // Reports
    fetchHeadcountReport,
    fetchLeaveUsageReport,
    fetchTurnoverReport,
  };
});
