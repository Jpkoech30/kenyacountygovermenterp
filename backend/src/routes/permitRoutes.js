/**
 * Permit Routes - Revenue & Business Licensing Module.
 * Mounted at /api/permits and /api/mpesa and /api/verify.
 *
 * Endpoints:
 *   Public (no auth):
 *     POST   /api/permits/apply         - Create permit draft
 *     POST   /api/permits/:id/pay       - Initiate M-Pesa STK Push
 *     GET    /api/permits/:id/status    - Check payment/permit status
 *     GET    /api/verify/:permit_id     - Public verification
 *     POST   /api/mpesa/callback        - Safaricom M-Pesa callback
 *
 *   Authenticated:
 *     GET    /api/permits               - List permits (role-filtered)
 *     GET    /api/permits/:id           - Permit details
 *     POST   /api/permits/assign        - Bulk assign (revenue_officer)
 *     PUT    /api/permits/:id/issue     - Issue permit (clerk)
 *     POST   /api/permits/:id/renew     - Renew permit
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  Permit,
  PermitType,
  PermitAssignment,
  Transaction,
  CitizenRepresentation,
  User,
} = require('../models');
const permitService = require('../services/permitService');

// ============================================================================
// PUBLIC ENDPOINTS (no authentication)
// ============================================================================

/**
 * POST /api/permits/apply
 * Create a new permit draft application.
 * Body: { business_name, kra_pin, business_activity, activity_code, employee_size,
 *         sub_county, ward, plot_no, road_street, building, floor, door_stall_no,
 *         phone, email }
 */
router.post('/apply', async (req, res, next) => {
  try {
    const permit = await permitService.applyForPermit(req.body);
    res.status(201).json({
      message: 'Permit application submitted successfully',
      permit: {
        id: permit.id,
        permit_id: permit.permit_id,
        status: permit.status,
        fee_paid: permit.fee_paid,
      },
      payment_instructions: {
        message: 'Proceed to payment to complete your application.',
        amount: permit.fee_paid,
        endpoint: `/api/permits/${permit.id}/pay`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/permits/:id/pay
 * Initiate M-Pesa STK Push for a permit.
 * Body: { phone: "2547XXXXXXXX" }
 */
router.post('/:id/pay', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone: ensure it starts with 254
    const formattedPhone = phone.startsWith('0')
      ? `254${phone.slice(1)}`
      : phone.startsWith('+')
        ? phone.slice(1)
        : phone;

    const result = await permitService.initiatePayment(req.params.id, formattedPhone);

    res.json({
      message: 'STK Push sent. Check your phone to complete payment.',
      transaction_id: result.transaction.id,
      checkout_request_id: result.stkResponse?.CheckoutRequestID,
      permit_id: result.transaction.permit_id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/permits/:id/status
 * Check the current status of a permit and its payment.
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const permit = await Permit.findByPk(req.params.id, {
      include: [
        { model: PermitType, as: 'permitType', attributes: ['name', 'code'] },
        { model: Transaction, as: 'transactions', attributes: ['amount', 'mpesa_receipt', 'payment_status', 'created_at'] },
      ],
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json({
      permit_id: permit.permit_id,
      applicant_name: permit.applicant_name,
      status: permit.status,
      fee_paid: permit.fee_paid,
      permit_type: permit.permitType?.name,
      effective_date: permit.effective_date,
      expiry_date: permit.expiry_date,
      transactions: permit.transactions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verify/:permit_id
 * Public verification endpoint - returns permit details if active.
 */
router.get('/verify/:permit_id', async (req, res, next) => {
  try {
    const permit = await Permit.findOne({
      where: { permit_id: req.params.permit_id },
      include: [
        { model: PermitType, as: 'permitType', attributes: ['name', 'code'] },
      ],
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found', valid: false });
    }

    if (permit.status !== 'active') {
      return res.json({
        valid: false,
        status: permit.status,
        message: 'This permit is not currently active.',
      });
    }

    res.json({
      valid: true,
      permit_id: permit.permit_id,
      applicant_name: permit.applicant_name,
      kra_pin: permit.kra_pin,
      business_activity: permit.business_activity,
      permit_type: permit.permitType?.name,
      fee_paid: permit.fee_paid,
      effective_date: permit.effective_date,
      expiry_date: permit.expiry_date,
      qr_code: permit.qr_code,
      issued_at: permit.issued_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mpesa/callback
 * Safaricom M-Pesa callback endpoint.
 * Updates transaction and permit status.
 */
router.post('/mpesa/callback', async (req, res, next) => {
  try {
    const result = await permitService.processPaymentCallback(req.body);

    console.log(`📋 M-Pesa callback processed: ${result.result.success ? 'SUCCESS' : 'FAILED'}`);

    // Safaricom expects an empty 200 response
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('❌ M-Pesa callback error:', error.message);
    // Still return 200 to Safaricom to prevent retries
    res.status(200).json({ ResultCode: 1, ResultDesc: error.message });
  }
});

// ============================================================================
// AUTHENTICATED ENDPOINTS
// ============================================================================

/**
 * GET /api/permits
 * List permits with role-based filtering.
 * - Admin: all permits
 * - Revenue Officer: paid permits (for assignment)
 * - Clerk: assigned permits
 * - Others: own permits (by phone/email)
 *
 * Query params: status, page, limit, search
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role?.name;
    const userId = req.user.id;

    const where = {};

    // Role-based filtering
    if (userRole === 'revenue_officer') {
      where.status = 'paid';
    } else if (userRole === 'revenue_clerk') {
      // Clerk sees permits assigned to them
      const assignedPermitIds = await PermitAssignment.findAll({
        where: { clerk_user_id: userId },
        attributes: ['permit_id'],
      });
      where.id = {
        [Op.in]: assignedPermitIds.map((a) => a.permit_id),
      };
    } else if (!['admin', 'supervisor'].includes(userRole)) {
      // Other roles: only see their own permits
      where.applicant_email = req.user.email;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search by permit_id or applicant_name
    if (search) {
      where[Op.or] = [
        { permit_id: { [Op.like]: `%${search}%` } },
        { applicant_name: { [Op.like]: `%${search}%` } },
        { kra_pin: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Permit.findAndCountAll({
      where,
      include: [
        { model: PermitType, as: 'permitType', attributes: ['name', 'code'] },
        { model: PermitAssignment, as: 'assignment', attributes: ['status', 'clerk_user_id'] },
        { model: Transaction, as: 'transactions', attributes: ['payment_status', 'mpesa_receipt', 'amount'], limit: 1 },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      permits: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/permits/:id
 * Get full permit details with all associations.
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const permit = await Permit.findByPk(req.params.id, {
      include: [
        { model: PermitType, as: 'permitType' },
        { model: Transaction, as: 'transactions' },
        {
          model: PermitAssignment,
          as: 'assignment',
          include: [
            { model: User, as: 'clerk', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: User, as: 'assigner', attributes: ['id', 'first_name', 'last_name', 'email'] },
          ],
        },
        { model: User, as: 'issuer', attributes: ['id', 'first_name', 'last_name'] },
        { model: CitizenRepresentation, as: 'representation' },
      ],
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json({ permit });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/permits/assign
 * Revenue officer only. Bulk assign paid permits to a clerk.
 * Body: { permit_ids: [1,2,3], clerk_id: 5 }
 */
router.post('/assign', authenticate, authorize('admin', 'revenue_officer'), async (req, res, next) => {
  try {
    const { permit_ids, clerk_id } = req.body;

    if (!permit_ids || !Array.isArray(permit_ids) || permit_ids.length === 0) {
      return res.status(400).json({ error: 'permit_ids array is required' });
    }
    if (!clerk_id) {
      return res.status(400).json({ error: 'clerk_id is required' });
    }

    const assignments = await permitService.bulkAssign(permit_ids, clerk_id, req.user.id);

    res.status(201).json({
      message: `${assignments.length} permit(s) assigned successfully`,
      assignments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/permits/:id/issue
 * Clerk only. Issue a permit (generate QR + PDF, mark active).
 */
router.put('/:id/issue', authenticate, authorize('admin', 'revenue_clerk'), async (req, res, next) => {
  try {
    const permit = await permitService.issuePermit(req.params.id, req.user.id);

    res.json({
      message: 'Permit issued successfully',
      permit: {
        id: permit.id,
        permit_id: permit.permit_id,
        status: permit.status,
        effective_date: permit.effective_date,
        expiry_date: permit.expiry_date,
        qr_code: permit.qr_code,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/permits/:id/renew
 * Renew an existing permit. Creates a new draft linked to the old one.
 */
router.post('/:id/renew', authenticate, async (req, res, next) => {
  try {
    const newPermit = await permitService.renewPermit(req.params.id, req.user?.id);

    res.status(201).json({
      message: 'Renewal application created. Proceed to payment.',
      permit: {
        id: newPermit.id,
        permit_id: newPermit.permit_id,
        status: newPermit.status,
        fee_paid: newPermit.fee_paid,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
