/**
 * HR Service - business logic for the Human Capital Management module.
 * Handles employee lifecycle, leave management, recruitment workflow,
 * attendance tracking, performance reviews, and disciplinary cases.
 */
const { Op } = require('sequelize');
const {
  Employee,
  EmploymentHistory,
  LeaveRequest,
  LeaveBalance,
  AttendanceLog,
  RecruitmentVacancy,
  RecruitmentApplication,
  PerformanceReview,
  DisciplinaryCase,
  Position,
  Department,
  User,
  Media,
} = require('../models');

// ============================================================================
// Employee Management
// ============================================================================

/**
 * Create a new employee record.
 * Auto-creates an employment_history entry with effective_from = contract_start_date.
 *
 * @param {Object} data - Employee data
 * @param {number} createdByUserId - User ID creating the record
 * @returns {Promise<Object>} Created employee with history
 */
async function createEmployee(data, createdByUserId) {
  const employee = await Employee.create({
    user_id: data.user_id || null,
    national_id: data.national_id,
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date || null,
    gender: data.gender || null,
    marital_status: data.marital_status || null,
    phone: data.phone || null,
    email: data.email || null,
    personal_email: data.personal_email || null,
    position_id: data.position_id || null,
    department_id: data.department_id || null,
    employment_type: data.employment_type || 'permanent',
    contract_start_date: data.contract_start_date,
    contract_end_date: data.contract_end_date || null,
    supervisor_id: data.supervisor_id || null,
    profile_photo_id: data.profile_photo_id || null,
    bank_account: data.bank_account || null,
    kra_pin: data.kra_pin || null,
    nssf_no: data.nssf_no || null,
    nhif_no: data.nhif_no || null,
    status: 'active',
  });

  // Auto-create employment history for new hire
  await EmploymentHistory.create({
    employee_id: employee.id,
    effective_from: data.contract_start_date,
    effective_to: null,
    position_id: data.position_id || null,
    department_id: data.department_id || null,
    supervisor_id: data.supervisor_id || null,
    change_reason: 'new_hire',
    created_by: createdByUserId,
    notes: 'Initial employment record',
  });

  // Auto-create leave balance for the current year
  const currentYear = new Date().getFullYear();
  const daysEntitled = data.employment_type === 'permanent' ? 21 : 6; // 0.5 * 12 = 6 for contract
  await LeaveBalance.create({
    employee_id: employee.id,
    year: currentYear,
    days_entitled: daysEntitled,
    days_taken: 0,
    days_remaining: daysEntitled,
  });

  return employee;
}

/**
 * Update an existing employee record.
 * If position, department, or supervisor changes, creates a new employment_history entry.
 *
 * @param {number} id - Employee ID
 * @param {Object} data - Updated employee data
 * @param {number} updatedByUserId - User ID making the change
 * @returns {Promise<Object>} Updated employee
 */
async function updateEmployee(id, data, updatedByUserId) {
  const employee = await Employee.findByPk(id);
  if (!employee) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }

  const changedFields = [];
  if (data.position_id && data.position_id !== employee.position_id) changedFields.push('position_id');
  if (data.department_id && data.department_id !== employee.department_id) changedFields.push('department_id');
  if (data.supervisor_id && data.supervisor_id !== employee.supervisor_id) changedFields.push('supervisor_id');

  // If position, department, or supervisor changed, close old history and create new
  if (changedFields.length > 0) {
    // Close current employment history
    await EmploymentHistory.update(
      { effective_to: new Date().toISOString().split('T')[0] },
      {
        where: {
          employee_id: id,
          effective_to: null,
        },
      }
    );

    // Determine change reason
    let changeReason = 'reshuffle';
    if (changedFields.includes('position_id')) {
      // Check if new position is higher grade (promotion) or lower (demotion)
      changeReason = 'promotion'; // Simplified; real logic would compare job grades
    }

    // Create new history entry
    await EmploymentHistory.create({
      employee_id: id,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: null,
      position_id: data.position_id || employee.position_id,
      department_id: data.department_id || employee.department_id,
      supervisor_id: data.supervisor_id || employee.supervisor_id,
      change_reason: changeReason,
      created_by: updatedByUserId,
      notes: `Updated: ${changedFields.join(', ')}`,
    });
  }

  // Update employee record
  await employee.update({
    position_id: data.position_id !== undefined ? data.position_id : employee.position_id,
    department_id: data.department_id !== undefined ? data.department_id : employee.department_id,
    supervisor_id: data.supervisor_id !== undefined ? data.supervisor_id : employee.supervisor_id,
    phone: data.phone !== undefined ? data.phone : employee.phone,
    email: data.email !== undefined ? data.email : employee.email,
    personal_email: data.personal_email !== undefined ? data.personal_email : employee.personal_email,
    bank_account: data.bank_account !== undefined ? data.bank_account : employee.bank_account,
    kra_pin: data.kra_pin !== undefined ? data.kra_pin : employee.kra_pin,
    nssf_no: data.nssf_no !== undefined ? data.nssf_no : employee.nssf_no,
    nhif_no: data.nhif_no !== undefined ? data.nhif_no : employee.nhif_no,
    marital_status: data.marital_status !== undefined ? data.marital_status : employee.marital_status,
  });

  return employee.reload();
}

/**
 * Change employee status (suspend, terminate, retire).
 * Creates an employment_history entry for the status change.
 *
 * @param {number} id - Employee ID
 * @param {string} newStatus - New status (suspended/terminated/retired)
 * @param {Object} options - { reason, userId }
 * @returns {Promise<Object>} Updated employee
 */
async function changeEmployeeStatus(id, newStatus, { reason, userId }) {
  const employee = await Employee.findByPk(id);
  if (!employee) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }

  const validTransitions = {
    active: ['on_leave', 'suspended', 'terminated', 'retired'],
    on_leave: ['active', 'suspended', 'terminated'],
    suspended: ['active', 'terminated'],
    terminated: [],
    retired: [],
  };

  if (!validTransitions[employee.status]?.includes(newStatus)) {
    const err = new Error(`Cannot transition from ${employee.status} to ${newStatus}`);
    err.status = 400;
    throw err;
  }

  // Close current employment history
  await EmploymentHistory.update(
    { effective_to: new Date().toISOString().split('T')[0] },
    {
      where: {
        employee_id: id,
        effective_to: null,
      },
    }
  );

  // Map status to change reason
  const reasonMap = {
    suspended: 'suspension',
    terminated: 'termination',
    retired: 'retirement',
    on_leave: 'leave',
  };

  // Create history entry for status change
  await EmploymentHistory.create({
    employee_id: id,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: newStatus === 'terminated' || newStatus === 'retired' ? new Date().toISOString().split('T')[0] : null,
    position_id: employee.position_id,
    department_id: employee.department_id,
    supervisor_id: employee.supervisor_id,
    change_reason: reasonMap[newStatus] || 'reshuffle',
    created_by: userId,
    notes: reason || `Status changed to ${newStatus}`,
  });

  employee.status = newStatus;
  await employee.save();
  return employee.reload();
}

// ============================================================================
// Leave Management
// ============================================================================

/**
 * Calculate total days between two dates (inclusive).
 */
function calculateLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Submit a leave request.
 * Validates leave balance before creating the request.
 *
 * @param {Object} data - Leave request data
 * @returns {Promise<Object>} Created leave request
 */
async function submitLeaveRequest(data) {
  const totalDays = calculateLeaveDays(data.start_date, data.end_date);

  // Check leave balance
  const year = new Date(data.start_date).getFullYear();
  let balance = await LeaveBalance.findOne({
    where: { employee_id: data.employee_id, year },
  });

  if (!balance) {
    // Auto-create balance if not exists
    const employee = await Employee.findByPk(data.employee_id);
    const daysEntitled = employee.employment_type === 'permanent' ? 21 : 6;
    balance = await LeaveBalance.create({
      employee_id: data.employee_id,
      year,
      days_entitled: daysEntitled,
      days_taken: 0,
      days_remaining: daysEntitled,
    });
  }

  if (balance.days_remaining < totalDays) {
    const err = new Error(
      `Insufficient leave balance. Requested: ${totalDays} days, Available: ${balance.days_remaining} days`
    );
    err.status = 400;
    throw err;
  }

  const leaveRequest = await LeaveRequest.create({
    employee_id: data.employee_id,
    leave_type: data.leave_type,
    start_date: data.start_date,
    end_date: data.end_date,
    total_days: totalDays,
    reason: data.reason || null,
    status: 'pending',
  });

  return leaveRequest;
}

/**
 * Approve a leave request.
 * Deducts days from leave balance.
 *
 * @param {number} id - Leave request ID
 * @param {number} approvedByUserId - User ID approving
 * @returns {Promise<Object>} Updated leave request
 */
async function approveLeaveRequest(id, approvedByUserId) {
  const leaveRequest = await LeaveRequest.findByPk(id);
  if (!leaveRequest) {
    const err = new Error('Leave request not found');
    err.status = 404;
    throw err;
  }

  if (leaveRequest.status !== 'pending') {
    const err = new Error(`Leave request is already ${leaveRequest.status}`);
    err.status = 400;
    throw err;
  }

  // Deduct from leave balance
  const year = new Date(leaveRequest.start_date).getFullYear();
  const balance = await LeaveBalance.findOne({
    where: { employee_id: leaveRequest.employee_id, year },
  });

  if (balance) {
    const newDaysTaken = parseFloat(balance.days_taken) + leaveRequest.total_days;
    const newDaysRemaining = parseFloat(balance.days_entitled) - newDaysTaken;
    await balance.update({
      days_taken: newDaysTaken,
      days_remaining: newDaysRemaining < 0 ? 0 : newDaysRemaining,
    });
  }

  leaveRequest.status = 'approved';
  leaveRequest.approved_by = approvedByUserId;
  leaveRequest.approval_date = new Date().toISOString().split('T')[0];
  await leaveRequest.save();

  return leaveRequest.reload();
}

/**
 * Reject a leave request.
 *
 * @param {number} id - Leave request ID
 * @param {number} rejectedByUserId - User ID rejecting
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated leave request
 */
async function rejectLeaveRequest(id, rejectedByUserId, reason) {
  const leaveRequest = await LeaveRequest.findByPk(id);
  if (!leaveRequest) {
    const err = new Error('Leave request not found');
    err.status = 404;
    throw err;
  }

  if (leaveRequest.status !== 'pending') {
    const err = new Error(`Leave request is already ${leaveRequest.status}`);
    err.status = 400;
    throw err;
  }

  leaveRequest.status = 'rejected';
  leaveRequest.approved_by = rejectedByUserId;
  leaveRequest.rejection_reason = reason || null;
  await leaveRequest.save();

  return leaveRequest.reload();
}

// ============================================================================
// Attendance
// ============================================================================

/**
 * Record check-in for an employee.
 *
 * @param {number} employeeId - Employee ID
 * @param {Object} options - { gps_latitude, gps_longitude, source, notes }
 * @returns {Promise<Object>} Created attendance log
 */
async function checkIn(employeeId, options = {}) {
  // Check if already checked in today without checkout
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await AttendanceLog.findOne({
    where: {
      employee_id: employeeId,
      check_in: { [Op.gte]: today },
      check_out: null,
    },
  });

  if (existing) {
    const err = new Error('Already checked in. Please check out first.');
    err.status = 400;
    throw err;
  }

  return AttendanceLog.create({
    employee_id: employeeId,
    check_in: new Date(),
    check_out: null,
    gps_latitude: options.gps_latitude || null,
    gps_longitude: options.gps_longitude || null,
    source: options.source || 'web',
    notes: options.notes || null,
  });
}

/**
 * Record check-out for an employee.
 *
 * @param {number} employeeId - Employee ID
 * @param {Object} options - { gps_latitude, gps_longitude, notes }
 * @returns {Promise<Object>} Updated attendance log
 */
async function checkOut(employeeId, options = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await AttendanceLog.findOne({
    where: {
      employee_id: employeeId,
      check_in: { [Op.gte]: today },
      check_out: null,
    },
    order: [['check_in', 'DESC']],
  });

  if (!log) {
    const err = new Error('No active check-in found for today');
    err.status = 400;
    throw err;
  }

  log.check_out = new Date();
  if (options.gps_latitude) log.gps_latitude = options.gps_latitude;
  if (options.gps_longitude) log.gps_longitude = options.gps_longitude;
  if (options.notes) log.notes = options.notes;
  await log.save();

  return log;
}

// ============================================================================
// Recruitment
// ============================================================================

/**
 * Submit a job application for a published vacancy.
 *
 * @param {Object} data - Application data
 * @returns {Promise<Object>} Created application
 */
async function submitApplication(data) {
  const vacancy = await RecruitmentVacancy.findByPk(data.vacancy_id);
  if (!vacancy) {
    const err = new Error('Vacancy not found');
    err.status = 404;
    throw err;
  }

  if (vacancy.status !== 'published') {
    const err = new Error('This vacancy is not currently accepting applications');
    err.status = 400;
    throw err;
  }

  if (new Date(vacancy.application_deadline) < new Date()) {
    const err = new Error('Application deadline has passed');
    err.status = 400;
    throw err;
  }

  return RecruitmentApplication.create({
    vacancy_id: data.vacancy_id,
    applicant_name: data.applicant_name,
    email: data.email,
    phone: data.phone || null,
    cover_letter: data.cover_letter || null,
    cv_attachment_id: data.cv_attachment_id || null,
    status: 'submitted',
  });
}

/**
 * Update application status (shortlist, interview, offer, hire, reject).
 * When status changes to 'hired', auto-creates an employee record.
 *
 * @param {number} id - Application ID
 * @param {string} newStatus - New status
 * @param {Object} options - { interview_score, offer_letter_id, hired_date, userId }
 * @returns {Promise<Object>} Updated application
 */
async function updateApplicationStatus(id, newStatus, options = {}) {
  const application = await RecruitmentApplication.findByPk(id, {
    include: [{ model: RecruitmentVacancy, as: 'vacancy' }],
  });

  if (!application) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }

  const validTransitions = {
    submitted: ['shortlisted', 'rejected'],
    shortlisted: ['interviewed', 'rejected'],
    interviewed: ['offered', 'rejected'],
    offered: ['hired', 'rejected'],
    hired: [],
    rejected: [],
  };

  if (!validTransitions[application.status]?.includes(newStatus)) {
    const err = new Error(`Cannot transition from ${application.status} to ${newStatus}`);
    err.status = 400;
    throw err;
  }

  const updateData = { status: newStatus };
  if (options.interview_score) updateData.interview_score = options.interview_score;
  if (options.offer_letter_id) updateData.offer_letter_id = options.offer_letter_id;
  if (newStatus === 'hired') {
    updateData.hired_date = options.hired_date || new Date().toISOString().split('T')[0];
  }

  await application.update(updateData);

  // Auto-create employee record when hired
  if (newStatus === 'hired' && options.userId) {
    const vacancy = application.vacancy;
    await createEmployee(
      {
        national_id: `TEMP-${Date.now()}`, // Placeholder; should be updated later
        first_name: application.applicant_name.split(' ')[0],
        last_name: application.applicant_name.split(' ').slice(1).join(' ') || 'N/A',
        email: application.email,
        phone: application.phone,
        position_id: vacancy.position_id,
        department_id: vacancy.department_id,
        employment_type: vacancy.employment_type,
        contract_start_date: updateData.hired_date,
        user_id: null,
      },
      options.userId
    );
  }

  return application.reload();
}

// ============================================================================
// Performance Reviews
// ============================================================================

/**
 * Submit a performance review (change from draft to submitted).
 *
 * @param {number} id - Review ID
 * @param {Object} data - Review data
 * @returns {Promise<Object>} Updated review
 */
async function submitPerformanceReview(id, data) {
  const review = await PerformanceReview.findByPk(id);
  if (!review) {
    const err = new Error('Performance review not found');
    err.status = 404;
    throw err;
  }

  await review.update({
    goals_achieved: data.goals_achieved || review.goals_achieved,
    strengths: data.strengths || review.strengths,
    areas_improvement: data.areas_improvement || review.areas_improvement,
    overall_rating: data.overall_rating || review.overall_rating,
    recommendations: data.recommendations || review.recommendations,
    status: 'submitted',
  });

  return review.reload();
}

// ============================================================================
// Reports
// ============================================================================

/**
 * Get headcount report grouped by department.
 *
 * @returns {Promise<Array>} Headcount data
 */
async function getHeadcountReport() {
  const departments = await Department.findAll({
    include: [{
      model: Employee,
      as: 'employees',
      attributes: ['id', 'status'],
      where: { status: 'active' },
      required: false,
    }],
  });

  return departments.map((dept) => ({
    department: dept.name,
    headcount: dept.employees ? dept.employees.length : 0,
  }));
}

/**
 * Get leave usage report for the current year.
 *
 * @returns {Promise<Array>} Leave usage by month
 */
async function getLeaveUsageReport() {
  const currentYear = new Date().getFullYear();
  const leaveRequests = await LeaveRequest.findAll({
    where: {
      status: 'approved',
      start_date: {
        [Op.gte]: `${currentYear}-01-01`,
        [Op.lte]: `${currentYear}-12-31`,
      },
    },
    include: [{
      model: Employee,
      as: 'employee',
      attributes: ['id', 'first_name', 'last_name', 'department_id'],
    }],
  });

  // Group by month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = monthNames.map((month, index) => ({
    month,
    total_days: 0,
    count: 0,
  }));

  leaveRequests.forEach((lr) => {
    const month = new Date(lr.start_date).getMonth();
    monthlyData[month].total_days += lr.total_days;
    monthlyData[month].count += 1;
  });

  return monthlyData;
}

/**
 * Get turnover report (employees who left in a period).
 *
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Turnover data
 */
async function getTurnoverReport(startDate, endDate) {
  const whereClause = {
    status: { [Op.in]: ['terminated', 'retired'] },
  };
  if (startDate && endDate) {
    whereClause.updatedAt = {
      [Op.gte]: new Date(startDate),
      [Op.lte]: new Date(endDate),
    };
  }

  const employees = await Employee.findAll({
    where: whereClause,
    include: [
      { model: Department, as: 'department', attributes: ['name'] },
      { model: Position, as: 'position', attributes: ['title'] },
    ],
  });

  return {
    total: employees.length,
    byStatus: {
      terminated: employees.filter((e) => e.status === 'terminated').length,
      retired: employees.filter((e) => e.status === 'retired').length,
    },
    employees,
  };
}

// ============================================================
// Recruitment Extension — Vacancy Requests
// ============================================================

async function createVacancyRequest(data) {
  return VacancyRequest.create({
    vacancy_id: data.vacancy_id,
    requested_by: data.requested_by,
    status: 'pending',
    approval_notes: data.approval_notes || null,
  });
}

async function approveVacancyRequest(id, approvedByUserId, notes) {
  const request = await VacancyRequest.findByPk(id);
  if (!request) throw new Error('Vacancy request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');
  await request.update({
    status: 'approved',
    approved_by: approvedByUserId,
    approval_notes: notes || request.approval_notes,
    approved_at: new Date(),
  });
  // Auto-publish the vacancy
  await RecruitmentVacancy.update({ status: 'published', published_at: new Date() }, { where: { id: request.vacancy_id } });
  return request;
}

async function rejectVacancyRequest(id, rejectedByUserId, reason) {
  const request = await VacancyRequest.findByPk(id);
  if (!request) throw new Error('Vacancy request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');
  await request.update({
    status: 'rejected',
    approved_by: rejectedByUserId,
    approval_notes: reason || request.approval_notes,
    approved_at: new Date(),
  });
  return request;
}

// ============================================================
// Recruitment Extension — Shortlisting
// ============================================================

async function shortlistApplication(applicationId, { score, comments, userId }) {
  const application = await RecruitmentApplication.findByPk(applicationId);
  if (!application) throw new Error('Application not found');
  if (application.status !== 'submitted') throw new Error('Application must be in submitted status');
  await application.update({
    shortlisting_score: score,
    shortlisting_comments: comments || null,
    status: score >= 50 ? 'shortlisted' : 'rejected',
    elimination_reason: score < 50 ? (comments || 'Below shortlisting threshold') : null,
    assigned_to: score >= 50 ? userId : null,
  });
  return application;
}

async function finalizeShortlist(vacancyId) {
  const shortlisted = await RecruitmentApplication.findAll({
    where: { vacancy_id: vacancyId, status: 'shortlisted' },
  });
  return shortlisted;
}

// ============================================================
// Recruitment Extension — Interview Panels
// ============================================================

async function createInterviewPanel(data) {
  const panel = await InterviewPanel.create({
    vacancy_id: data.vacancy_id,
    name: data.name,
    chairperson_id: data.chairperson_id,
    status: 'active',
  });
  if (data.members && Array.isArray(data.members)) {
    for (const memberId of data.members) {
      const role = memberId === data.chairperson_id ? 'chairperson' : 'member';
      await PanelMember.create({ panel_id: panel.id, user_id: memberId, role });
    }
  }
  return InterviewPanel.findByPk(panel.id, {
    include: [{ association: 'members', include: [{ association: 'member' }] }],
  });
}

async function addPanelMember(panelId, userId, role = 'member') {
  return PanelMember.create({ panel_id: panelId, user_id: userId, role });
}

async function removePanelMember(panelMemberId) {
  const member = await PanelMember.findByPk(panelMemberId);
  if (!member) throw new Error('Panel member not found');
  await member.destroy();
  return { removed: true };
}

// ============================================================
// Recruitment Extension — Interview Scoring
// ============================================================

async function submitInterviewScore(data) {
  const [score, created] = await InterviewScore.upsert({
    application_id: data.application_id,
    panel_member_id: data.panel_member_id,
    score: data.score,
    comments: data.comments || null,
  });
  // Recalculate average score for the application
  const scores = await InterviewScore.findAll({ where: { application_id: data.application_id } });
  const avg = scores.reduce((sum, s) => sum + parseFloat(s.score), 0) / scores.length;
  await RecruitmentApplication.update({ interview_score: Math.round(avg * 100) / 100 }, { where: { id: data.application_id } });
  return score;
}

// ============================================================
// Recruitment Extension — Appointment Letters (pdfkit)
// ============================================================

async function generateAppointmentLetter(applicationId, issuedByUserId) {
  const application = await RecruitmentApplication.findByPk(applicationId, {
    include: [
      { association: 'vacancy', include: [{ association: 'department' }, { association: 'position' }] },
    ],
  });
  if (!application) throw new Error('Application not found');
  if (application.status !== 'offered') throw new Error('Application must be in offered status');

  const letterNumber = `APPT-${String(application.id).padStart(5, '0')}-${new Date().getFullYear()}`;

  // Build letter content as JSON (stored in DB)
  const content = {
    letterNumber,
    date: new Date().toISOString().split('T')[0],
    applicantName: application.applicant_name,
    position: application.vacancy?.position?.title || 'Position',
    department: application.vacancy?.department?.name || 'Department',
    employmentType: application.vacancy?.employment_type || 'Permanent',
    startDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    salaryGrade: 'To be determined',
    terms: [
      'This appointment is subject to the County Public Service Board Act.',
      'The probation period is six (6) months.',
      'You shall adhere to the Code of Conduct and Ethics for Public Officers.',
      'Any misrepresentation of qualifications will lead to immediate termination.',
    ],
  };

  // Generate PDF using pdfkit
  const PDFDocument = require('pdfkit');
  const path = require('path');
  const fs = require('fs');

  const pdfDir = path.join(__dirname, '../../public/appointment-letters');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const pdfPath = path.join(pdfDir, `${letterNumber}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Header
  doc.fontSize(16).font('Helvetica-Bold').text('COUNTY GOVERNMENT', { align: 'center' });
  doc.fontSize(14).text('OFFICE OF THE COUNTY PUBLIC SERVICE BOARD', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(12).font('Helvetica-Bold').text('LETTER OF APPOINTMENT', { align: 'center' });
  doc.moveDown(2);

  // Reference
  doc.fontSize(10).font('Helvetica').text(`Ref: ${letterNumber}`, { align: 'right' });
  doc.text(`Date: ${content.date}`, { align: 'right' });
  doc.moveDown(2);

  // Body
  doc.fontSize(11).text(`Dear ${content.applicantName},`);
  doc.moveDown(1);
  doc.fontSize(11).text(`RE: APPOINTMENT TO THE POSITION OF ${content.position.toUpperCase()}`);
  doc.moveDown(1);
  doc.fontSize(10).text(`Following your successful interview, I am pleased to offer you the position of ${content.position} in the ${content.department} on ${content.employmentType} terms.`);
  doc.moveDown(1);
  doc.text(`Your expected start date is ${content.startDate}.`);
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Terms and Conditions:');
  doc.font('Helvetica');
  content.terms.forEach((term) => {
    doc.text(`• ${term}`);
  });
  doc.moveDown(2);
  doc.text('Please sign and return a copy of this letter to confirm acceptance.', { align: 'center' });
  doc.moveDown(3);
  doc.text('_________________________', { align: 'left' });
  doc.text('County Public Service Board', { align: 'left' });
  doc.moveDown(1);
  doc.text('_________________________', { align: 'right' });
  doc.text('Applicant Signature', { align: 'right' });

  doc.end();

  // Wait for stream to finish
  await new Promise((resolve) => stream.on('finish', resolve));

  // Create DB record
  const letter = await AppointmentLetter.create({
    application_id: applicationId,
    letter_number: letterNumber,
    content,
    pdf_path: `/appointment-letters/${letterNumber}.pdf`,
    status: 'draft',
    issued_by: issuedByUserId,
    issued_at: new Date(),
  });

  return AppointmentLetter.findByPk(letter.id, {
    include: [{ association: 'application' }],
  });
}

async function issueAppointmentLetter(letterId) {
  const letter = await AppointmentLetter.findByPk(letterId);
  if (!letter) throw new Error('Appointment letter not found');
  await letter.update({ status: 'issued' });
  return letter;
}

// ============================================================
// Recruitment Extension — Dashboard Metrics
// ============================================================

async function getRecruitmentDashboard() {
  const [pendingRequests, activeVacancies, totalApplications, shortlistedCount, upcomingInterviews, draftLetters] = await Promise.all([
    VacancyRequest.count({ where: { status: 'pending' } }),
    RecruitmentVacancy.count({ where: { status: 'published' } }),
    RecruitmentApplication.count(),
    RecruitmentApplication.count({ where: { status: 'shortlisted' } }),
    InterviewPanel.count({ where: { status: 'active' } }),
    AppointmentLetter.count({ where: { status: 'draft' } }),
  ]);
  return { pendingRequests, activeVacancies, totalApplications, shortlistedCount, upcomingInterviews, draftLetters };
}

module.exports = {
  createEmployee,
  updateEmployee,
  changeEmployeeStatus,
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  checkIn,
  checkOut,
  submitApplication,
  updateApplicationStatus,
  submitPerformanceReview,
  getHeadcountReport,
  getLeaveUsageReport,
  getTurnoverReport,
  // Recruitment Extension
  createVacancyRequest,
  approveVacancyRequest,
  rejectVacancyRequest,
  shortlistApplication,
  finalizeShortlist,
  createInterviewPanel,
  addPanelMember,
  removePanelMember,
  submitInterviewScore,
  generateAppointmentLetter,
  issueAppointmentLetter,
  getRecruitmentDashboard,
};
