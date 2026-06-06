/**
 * HR Routes - Human Capital Management Module.
 * Mounted at /api/hr and /api/public.
 *
 * Endpoints:
 *   Public (no auth):
 *     GET    /api/public/vacancies              - List published vacancies
 *     POST   /api/public/applications           - Submit job application
 *
 *   Employee Self-Service (role: employee):
 *     GET    /api/hr/employees/me               - My profile
 *     PUT    /api/hr/employees/me               - Update my profile
 *     POST   /api/hr/leave/request              - Submit leave request
 *     GET    /api/hr/leave/requests             - My leave requests
 *     GET    /api/hr/attendance/me              - My attendance logs
 *     GET    /api/hr/performance/me             - My performance reviews
 *
 *   Supervisor (role: supervisor):
 *     GET    /api/hr/employees/team             - My team members
 *     GET    /api/hr/leave/team-requests        - Team leave requests
 *     POST   /api/hr/leave/:id/approve          - Approve leave
 *     POST   /api/hr/leave/:id/reject           - Reject leave
 *     GET    /api/hr/performance/team-reviews   - Team performance reviews
 *     POST   /api/hr/performance/:id/submit     - Submit performance review
 *
 *   HR Officer (role: hr_officer, admin):
 *     GET    /api/hr/employees                  - List employees (paginated, filtered)
 *     POST   /api/hr/employees                  - Create employee
 *     GET    /api/hr/employees/:id              - Employee details
 *     PUT    /api/hr/employees/:id              - Update employee
 *     POST   /api/hr/employees/:id/employment-history  - Add history entry
 *     POST   /api/hr/employees/:id/suspend      - Suspend employee
 *     POST   /api/hr/employees/:id/terminate    - Terminate employee
 *     POST   /api/hr/employees/:id/retire       - Retire employee
 *     GET    /api/hr/vacancies                  - List all vacancies
 *     POST   /api/hr/vacancies                  - Create vacancy
 *     PUT    /api/hr/vacancies/:id              - Update vacancy
 *     GET    /api/hr/applications               - List applications
 *     GET    /api/hr/applications/:id           - Application details
 *     PUT    /api/hr/applications/:id/status    - Update application status
 *     GET    /api/hr/disciplinary               - List disciplinary cases
 *     POST   /api/hr/disciplinary               - Create disciplinary case
 *     PUT    /api/hr/disciplinary/:id           - Update disciplinary case
 *     GET    /api/hr/reports/headcount          - Headcount report
 *     GET    /api/hr/reports/leave-usage        - Leave usage report
 *     GET    /api/hr/reports/turnover           - Turnover report
 *
 *   Board Member (role: board_member):
 *     GET    /api/hr/reports                    - All reports
 *     GET    /api/hr/applications               - View applications
 *     POST   /api/hr/applications/:id/approve-appointment - Approve appointment
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
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
const hrService = require('../services/hrService');

// ============================================================================
// PUBLIC ENDPOINTS (no authentication)
// ============================================================================

/**
 * GET /api/public/vacancies
 * List all published vacancies that are still accepting applications.
 */
router.get('/public/vacancies', async (req, res, next) => {
  try {
    const vacancies = await RecruitmentVacancy.findAll({
      where: {
        status: 'published',
        application_deadline: { [Op.gte]: new Date().toISOString().split('T')[0] },
      },
      include: [
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
      ],
      order: [['published_at', 'DESC']],
    });
    res.json({ vacancies });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/applications
 * Submit a job application for a published vacancy.
 */
router.post('/public/applications', async (req, res, next) => {
  try {
    const application = await hrService.submitApplication(req.body);
    res.status(201).json({
      message: 'Application submitted successfully',
      application,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// EMPLOYEE SELF-SERVICE (authenticated, role: employee)
// ============================================================================

/**
 * GET /api/hr/employees/me
 * Get the currently logged-in employee's profile.
 */
router.get('/hr/employees/me', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      where: { user_id: req.user.id },
      include: [
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Employee, as: 'supervisor', attributes: ['id', 'first_name', 'last_name'] },
        { model: Media, as: 'profilePhoto', attributes: ['id', 'disk_filename', 'mime_type'] },
      ],
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    // Get current leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: { employee_id: employee.id, year: currentYear },
    });

    res.json({ employee, leaveBalance });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hr/employees/me
 * Update the currently logged-in employee's profile (limited fields).
 */
router.put('/hr/employees/me', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const allowedFields = ['phone', 'personal_email', 'bank_account', 'marital_status'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await employee.update(updates);
    res.json({ message: 'Profile updated', employee });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/leave/request
 * Submit a leave request (employee self-service).
 */
router.post('/hr/leave/request', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const leaveRequest = await hrService.submitLeaveRequest({
      employee_id: employee.id,
      leave_type: req.body.leave_type,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      reason: req.body.reason,
    });

    res.status(201).json({ message: 'Leave request submitted', leaveRequest });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/leave/requests
 * Get the currently logged-in employee's leave requests.
 */
router.get('/hr/leave/requests', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const where = { employee_id: employee.id };
    if (req.query.status) where.status = req.query.status;

    const leaveRequests = await LeaveRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ leaveRequests });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/attendance/me
 * Get the currently logged-in employee's attendance logs.
 */
router.get('/hr/attendance/me', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const where = { employee_id: employee.id };
    if (req.query.start_date && req.query.end_date) {
      where.check_in = {
        [Op.gte]: new Date(req.query.start_date),
        [Op.lte]: new Date(req.query.end_date + 'T23:59:59'),
      };
    }

    const logs = await AttendanceLog.findAll({
      where,
      order: [['check_in', 'DESC']],
      limit: parseInt(req.query.limit) || 30,
    });

    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/performance/me
 * Get the currently logged-in employee's performance reviews.
 */
router.get('/hr/performance/me', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const reviews = await PerformanceReview.findAll({
      where: { employee_id: employee.id },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// SUPERVISOR ENDPOINTS (role: supervisor)
// ============================================================================

/**
 * GET /api/hr/employees/team
 * Get the supervisor's team members.
 */
router.get('/hr/employees/team', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const supervisor = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!supervisor) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    const team = await Employee.findAll({
      where: { supervisor_id: supervisor.id },
      include: [
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: Department, as: 'department', attributes: ['name'] },
      ],
    });

    res.json({ team, supervisor });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/leave/team-requests
 * Get leave requests from the supervisor's team.
 */
router.get('/hr/leave/team-requests', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const supervisor = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!supervisor) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const teamIds = await Employee.findAll({
      where: { supervisor_id: supervisor.id },
      attributes: ['id'],
    });

    const where = {
      employee_id: { [Op.in]: teamIds.map((e) => e.id) },
    };
    if (req.query.status) where.status = req.query.status;

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ leaveRequests });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/leave/:id/approve
 * Approve a leave request (supervisor).
 */
router.post('/hr/leave/:id/approve', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const leaveRequest = await hrService.approveLeaveRequest(req.params.id, req.user.id);
    res.json({ message: 'Leave request approved', leaveRequest });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/leave/:id/reject
 * Reject a leave request (supervisor).
 */
router.post('/hr/leave/:id/reject', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const leaveRequest = await hrService.rejectLeaveRequest(req.params.id, req.user.id, req.body.reason);
    res.json({ message: 'Leave request rejected', leaveRequest });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/performance/team-reviews
 * Get performance reviews for the supervisor's team.
 */
router.get('/hr/performance/team-reviews', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const supervisor = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!supervisor) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const teamIds = await Employee.findAll({
      where: { supervisor_id: supervisor.id },
      attributes: ['id'],
    });

    const reviews = await PerformanceReview.findAll({
      where: { employee_id: { [Op.in]: teamIds.map((e) => e.id) } },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/performance/:id/submit
 * Submit a performance review for a team member.
 */
router.post('/hr/performance/:id/submit', authenticate, authorize('supervisor', 'hr_officer', 'admin'), async (req, res, next) => {
  try {
    const review = await hrService.submitPerformanceReview(req.params.id, req.body);
    res.json({ message: 'Performance review submitted', review });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// HR OFFICER ENDPOINTS (role: hr_officer, admin)
// ============================================================================

/**
 * GET /api/hr/employees
 * List all employees with pagination and filtering.
 */
router.get('/hr/employees', authenticate, authorize('hr_officer', 'admin', 'supervisor'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.department_id) where.department_id = req.query.department_id;
    if (req.query.employment_type) where.employment_type = req.query.employment_type;
    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
        { national_id: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Employee, as: 'supervisor', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      employees: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/employees
 * Create a new employee record.
 */
router.post('/hr/employees', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await hrService.createEmployee(req.body, req.user.id);
    const created = await Employee.findByPk(employee.id, {
      include: [
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: Department, as: 'department', attributes: ['name'] },
      ],
    });
    res.status(201).json({ message: 'Employee created successfully', employee: created });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/employees/:id
 * Get detailed employee information.
 */
router.get('/hr/employees/:id', authenticate, authorize('hr_officer', 'admin', 'supervisor'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Employee, as: 'supervisor', attributes: ['id', 'first_name', 'last_name'] },
        { model: Media, as: 'profilePhoto', attributes: ['id', 'disk_filename', 'mime_type'] },
        {
          model: EmploymentHistory,
          as: 'employmentHistory',
          include: [
            { model: Position, as: 'position', attributes: ['title'] },
            { model: Department, as: 'department', attributes: ['name'] },
            { model: User, as: 'createdBy', attributes: ['id', 'first_name', 'last_name'] },
          ],
          order: [['effective_from', 'DESC']],
        },
        {
          model: LeaveBalance,
          as: 'leaveBalances',
          order: [['year', 'DESC']],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get recent leave requests
    const recentLeaves = await LeaveRequest.findAll({
      where: { employee_id: employee.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({ employee, recentLeaves });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hr/employees/:id
 * Update an employee record.
 */
router.put('/hr/employees/:id', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await hrService.updateEmployee(req.params.id, req.body, req.user.id);
    res.json({ message: 'Employee updated successfully', employee });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/employees/:id/employment-history
 * Add a manual employment history entry.
 */
router.post('/hr/employees/:id/employment-history', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const history = await EmploymentHistory.create({
      employee_id: parseInt(req.params.id),
      effective_from: req.body.effective_from,
      effective_to: req.body.effective_to || null,
      position_id: req.body.position_id || employee.position_id,
      department_id: req.body.department_id || employee.department_id,
      supervisor_id: req.body.supervisor_id || employee.supervisor_id,
      change_reason: req.body.change_reason || 'reshuffle',
      document_attachment_id: req.body.document_attachment_id || null,
      created_by: req.user.id,
      notes: req.body.notes || null,
    });

    res.status(201).json({ message: 'Employment history added', history });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/employees/:id/suspend
 * Suspend an employee.
 */
router.post('/hr/employees/:id/suspend', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await hrService.changeEmployeeStatus(req.params.id, 'suspended', {
      reason: req.body.reason,
      userId: req.user.id,
    });
    res.json({ message: 'Employee suspended', employee });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/employees/:id/terminate
 * Terminate an employee.
 */
router.post('/hr/employees/:id/terminate', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await hrService.changeEmployeeStatus(req.params.id, 'terminated', {
      reason: req.body.reason,
      userId: req.user.id,
    });
    res.json({ message: 'Employee terminated', employee });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/employees/:id/retire
 * Retire an employee.
 */
router.post('/hr/employees/:id/retire', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const employee = await hrService.changeEmployeeStatus(req.params.id, 'retired', {
      reason: req.body.reason,
      userId: req.user.id,
    });
    res.json({ message: 'Employee retired', employee });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// VACANCY MANAGEMENT (HR Officer)
// ============================================================================

/**
 * GET /api/hr/vacancies
 * List all recruitment vacancies.
 */
router.get('/hr/vacancies', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const vacancies = await RecruitmentVacancy.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Position, as: 'position', attributes: ['title', 'job_grade'] },
        { model: User, as: 'createdBy', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ vacancies });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/vacancies
 * Create a new recruitment vacancy.
 */
router.post('/hr/vacancies', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const vacancy = await RecruitmentVacancy.create({
      title: req.body.title,
      department_id: req.body.department_id || null,
      position_id: req.body.position_id || null,
      employment_type: req.body.employment_type || 'permanent',
      job_description: req.body.job_description || null,
      requirements: req.body.requirements || null,
      no_of_posts: req.body.no_of_posts || 1,
      application_deadline: req.body.application_deadline,
      status: req.body.status || 'draft',
      created_by: req.user.id,
      published_at: req.body.status === 'published' ? new Date() : null,
    });

    res.status(201).json({ message: 'Vacancy created', vacancy });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hr/vacancies/:id
 * Update a recruitment vacancy.
 */
router.put('/hr/vacancies/:id', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const vacancy = await RecruitmentVacancy.findByPk(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const updateData = {};
    const allowedFields = ['title', 'department_id', 'position_id', 'employment_type',
      'job_description', 'requirements', 'no_of_posts', 'application_deadline', 'status'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (req.body.status === 'published' && vacancy.status !== 'published') {
      updateData.published_at = new Date();
    }

    await vacancy.update(updateData);
    res.json({ message: 'Vacancy updated', vacancy });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// APPLICATION MANAGEMENT (HR Officer / Board Member)
// ============================================================================

/**
 * GET /api/hr/applications
 * List all recruitment applications.
 */
router.get('/hr/applications', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.vacancy_id) where.vacancy_id = req.query.vacancy_id;

    const applications = await RecruitmentApplication.findAll({
      where,
      include: [
        { model: RecruitmentVacancy, as: 'vacancy', attributes: ['id', 'title'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ applications });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/applications/:id
 * Get application details.
 */
router.get('/hr/applications/:id', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const application = await RecruitmentApplication.findByPk(req.params.id, {
      include: [
        { model: RecruitmentVacancy, as: 'vacancy' },
        { model: Media, as: 'cvAttachment', attributes: ['id', 'disk_filename', 'mime_type'] },
        { model: Media, as: 'offerLetter', attributes: ['id', 'disk_filename', 'mime_type'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hr/applications/:id/status
 * Update application status (shortlist, interview, offer, hire, reject).
 */
router.put('/hr/applications/:id/status', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const application = await hrService.updateApplicationStatus(req.params.id, req.body.status, {
      interview_score: req.body.interview_score,
      offer_letter_id: req.body.offer_letter_id,
      hired_date: req.body.hired_date,
      userId: req.user.id,
    });
    res.json({ message: `Application status updated to ${req.body.status}`, application });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/applications/:id/approve-appointment
 * Board member approves appointment of a hired applicant.
 */
router.post('/hr/applications/:id/approve-appointment', authenticate, authorize('board_member', 'admin'), async (req, res, next) => {
  try {
    const application = await RecruitmentApplication.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (application.status !== 'hired') {
      return res.status(400).json({ error: 'Application must be in hired status to approve appointment' });
    }

    res.json({ message: 'Appointment approved', application });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// DISCIPLINARY CASES (HR Officer)
// ============================================================================

/**
 * GET /api/hr/disciplinary
 * List all disciplinary cases.
 */
router.get('/hr/disciplinary', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.employee_id) where.employee_id = req.query.employee_id;

    const cases = await DisciplinaryCase.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'national_id'] },
        { model: User, as: 'closedBy', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ cases });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/disciplinary
 * Create a new disciplinary case.
 */
router.post('/hr/disciplinary', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const disciplinaryCase = await DisciplinaryCase.create({
      employee_id: req.body.employee_id,
      case_type: req.body.case_type,
      description: req.body.description,
      decision: req.body.decision || null,
      status: 'open',
      documents: req.body.documents || null,
    });

    res.status(201).json({ message: 'Disciplinary case created', case: disciplinaryCase });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hr/disciplinary/:id
 * Update a disciplinary case (close it with a decision).
 */
router.put('/hr/disciplinary/:id', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const disciplinaryCase = await DisciplinaryCase.findByPk(req.params.id);
    if (!disciplinaryCase) {
      return res.status(404).json({ error: 'Disciplinary case not found' });
    }

    const updateData = {};
    if (req.body.decision) updateData.decision = req.body.decision;
    if (req.body.status === 'closed') {
      updateData.status = 'closed';
      updateData.closed_by = req.user.id;
      updateData.closed_at = new Date();
    }
    if (req.body.documents) updateData.documents = req.body.documents;

    await disciplinaryCase.update(updateData);
    res.json({ message: 'Disciplinary case updated', case: disciplinaryCase });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PERFORMANCE REVIEWS (HR Officer)
// ============================================================================

/**
 * POST /api/hr/performance
 * Create a new performance review (HR officer creates draft).
 */
router.post('/hr/performance', authenticate, authorize('hr_officer', 'admin', 'supervisor'), async (req, res, next) => {
  try {
    const review = await PerformanceReview.create({
      employee_id: req.body.employee_id,
      reviewer_id: req.user.id,
      review_period_start: req.body.review_period_start,
      review_period_end: req.body.review_period_end,
      goals_achieved: req.body.goals_achieved || null,
      strengths: req.body.strengths || null,
      areas_improvement: req.body.areas_improvement || null,
      overall_rating: req.body.overall_rating || null,
      recommendations: req.body.recommendations || null,
      status: 'draft',
    });

    res.status(201).json({ message: 'Performance review created', review });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/performance
 * List all performance reviews.
 */
router.get('/hr/performance', authenticate, authorize('hr_officer', 'admin', 'supervisor'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.employee_id) where.employee_id = req.query.employee_id;

    const reviews = await PerformanceReview.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// ATTENDANCE (HR Officer - check-in/out on behalf)
// ============================================================================

/**
 * POST /api/hr/attendance/check-in
 * Record check-in for an employee (self-service or HR officer).
 */
router.post('/hr/attendance/check-in', authenticate, async (req, res, next) => {
  try {
    let employeeId;
    if (req.body.employee_id && ['hr_officer', 'admin'].includes(req.user.role?.name)) {
      employeeId = req.body.employee_id;
    } else {
      const employee = await Employee.findOne({ where: { user_id: req.user.id } });
      if (!employee) return res.status(404).json({ error: 'Employee record not found' });
      employeeId = employee.id;
    }

    const log = await hrService.checkIn(employeeId, {
      gps_latitude: req.body.gps_latitude,
      gps_longitude: req.body.gps_longitude,
      source: req.body.source || 'web',
      notes: req.body.notes,
    });

    res.status(201).json({ message: 'Checked in successfully', log });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hr/attendance/check-out
 * Record check-out for an employee (self-service or HR officer).
 */
router.post('/hr/attendance/check-out', authenticate, async (req, res, next) => {
  try {
    let employeeId;
    if (req.body.employee_id && ['hr_officer', 'admin'].includes(req.user.role?.name)) {
      employeeId = req.body.employee_id;
    } else {
      const employee = await Employee.findOne({ where: { user_id: req.user.id } });
      if (!employee) return res.status(404).json({ error: 'Employee record not found' });
      employeeId = employee.id;
    }

    const log = await hrService.checkOut(employeeId, {
      gps_latitude: req.body.gps_latitude,
      gps_longitude: req.body.gps_longitude,
      notes: req.body.notes,
    });

    res.json({ message: 'Checked out successfully', log });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// REPORTS (HR Officer / Board Member)
// ============================================================================

/**
 * GET /api/hr/reports/headcount
 * Headcount report grouped by department.
 */
router.get('/hr/reports/headcount', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const data = await hrService.getHeadcountReport();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/reports/leave-usage
 * Leave usage report for the current year.
 */
router.get('/hr/reports/leave-usage', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const data = await hrService.getLeaveUsageReport();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/reports/turnover
 * Turnover report (terminated/retired employees in a date range).
 */
router.get('/hr/reports/turnover', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const data = await hrService.getTurnoverReport(req.query.start_date, req.query.end_date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hr/reports
 * All reports combined (for board member dashboard).
 */
router.get('/hr/reports', authenticate, authorize('board_member', 'admin', 'hr_officer'), async (req, res, next) => {
  try {
    const [headcount, leaveUsage, turnover] = await Promise.all([
      hrService.getHeadcountReport(),
      hrService.getLeaveUsageReport(),
      hrService.getTurnoverReport(req.query.start_date, req.query.end_date),
    ]);
    res.json({ headcount, leaveUsage, turnover });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Dashboard Metrics
// ============================================================
router.get('/hr/recruitment/dashboard', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const metrics = await hrService.getRecruitmentDashboard();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Vacancy Requests
// ============================================================

// List all vacancy requests
router.get('/hr/vacancy-requests', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const requests = await VacancyRequest.findAll({
      include: [
        { association: 'vacancy' },
        { association: 'requester', attributes: ['id', 'name', 'email'] },
        { association: 'approver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Create a vacancy request
router.post('/hr/vacancy-requests', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const request = await hrService.createVacancyRequest({
      vacancy_id: req.body.vacancy_id,
      requested_by: req.user.id,
      approval_notes: req.body.approval_notes,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// Approve a vacancy request
router.put('/hr/vacancy-requests/:id/approve', authenticate, authorize('board_member', 'admin'), async (req, res, next) => {
  try {
    const request = await hrService.approveVacancyRequest(req.params.id, req.user.id, req.body.notes);
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// Reject a vacancy request
router.put('/hr/vacancy-requests/:id/reject', authenticate, authorize('board_member', 'admin'), async (req, res, next) => {
  try {
    const request = await hrService.rejectVacancyRequest(req.params.id, req.user.id, req.body.reason);
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Shortlisting
// ============================================================

// List applications for a vacancy (with shortlisting data)
router.get('/hr/vacancies/:vacancyId/applications', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const applications = await RecruitmentApplication.findAll({
      where: { vacancy_id: req.params.vacancyId },
      include: [
        { association: 'vacancy' },
        { association: 'cvAttachment' },
        { association: 'coverLetterAttachment' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// Shortlist/reject an application
router.put('/hr/applications/:id/shortlist', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const application = await hrService.shortlistApplication(req.params.id, {
      score: req.body.score,
      comments: req.body.comments,
      userId: req.user.id,
    });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// Finalize shortlist for a vacancy
router.post('/hr/vacancies/:vacancyId/finalize-shortlist', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const shortlisted = await hrService.finalizeShortlist(req.params.vacancyId);
    res.json(shortlisted);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Interview Panels
// ============================================================

// List interview panels
router.get('/hr/interview-panels', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const panels = await InterviewPanel.findAll({
      include: [
        { association: 'vacancy' },
        { association: 'chairperson', attributes: ['id', 'name', 'email'] },
        { association: 'members', include: [{ association: 'member', attributes: ['id', 'name', 'email'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(panels);
  } catch (err) {
    next(err);
  }
});

// Create interview panel
router.post('/hr/interview-panels', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const panel = await hrService.createInterviewPanel({
      vacancy_id: req.body.vacancy_id,
      name: req.body.name,
      chairperson_id: req.body.chairperson_id,
      members: req.body.members,
    });
    res.status(201).json(panel);
  } catch (err) {
    next(err);
  }
});

// Add panel member
router.post('/hr/interview-panels/:panelId/members', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const member = await hrService.addPanelMember(req.params.panelId, req.body.user_id, req.body.role || 'member');
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
});

// Remove panel member
router.delete('/hr/interview-panel-members/:id', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const result = await hrService.removePanelMember(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Interview Scoring
// ============================================================

// Submit interview score
router.post('/hr/interview-scores', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const score = await hrService.submitInterviewScore({
      application_id: req.body.application_id,
      panel_member_id: req.body.panel_member_id,
      score: req.body.score,
      comments: req.body.comments,
    });
    res.status(201).json(score);
  } catch (err) {
    next(err);
  }
});

// Get scores for an application
router.get('/hr/applications/:id/scores', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const scores = await InterviewScore.findAll({
      where: { application_id: req.params.id },
      include: [{ association: 'panelMember', include: [{ association: 'member', attributes: ['id', 'name'] }] }],
    });
    res.json(scores);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Recruitment Extension — Appointment Letters
// ============================================================

// List appointment letters
router.get('/hr/appointment-letters', authenticate, authorize('hr_officer', 'admin', 'board_member'), async (req, res, next) => {
  try {
    const letters = await AppointmentLetter.findAll({
      include: [
        { association: 'application', include: [{ association: 'vacancy' }] },
        { association: 'issuer', attributes: ['id', 'name', 'email'] },
        { association: 'signer', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(letters);
  } catch (err) {
    next(err);
  }
});

// Generate appointment letter (PDF)
router.post('/hr/applications/:id/generate-letter', authenticate, authorize('hr_officer', 'admin'), async (req, res, next) => {
  try {
    const letter = await hrService.generateAppointmentLetter(req.params.id, req.user.id);
    res.status(201).json(letter);
  } catch (err) {
    next(err);
  }
});

// Issue appointment letter
router.put('/hr/appointment-letters/:id/issue', authenticate, authorize('board_member', 'admin'), async (req, res, next) => {
  try {
    const letter = await hrService.issueAppointmentLetter(req.params.id);
    res.json(letter);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
