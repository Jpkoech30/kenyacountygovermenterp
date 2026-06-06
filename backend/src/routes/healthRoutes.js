/**
 * Health Routes - Health Facility Management Module.
 * Mounted at /api/health.
 *
 * Role-based access:
 *   health_manager      → Full access (inventory CRUD, campaigns, reports)
 *   health_worker       → Add visits, view patients, view inventory (read-only), view campaigns
 *   pharmacy_tech       → Manage inventory (receipts, issues), stock alerts
 *   health_records_officer → Manage patient records, view reports
 *   admin               → Full access
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const healthService = require('../services/healthService');

// ── Helper: roles for full inventory management ──
const INVENTORY_MANAGER = ['health_manager', 'pharmacy_tech', 'admin'];
const INVENTORY_READ = ['health_manager', 'health_worker', 'pharmacy_tech', 'health_records_officer', 'admin'];
const PATIENT_WRITE = ['health_manager', 'health_worker', 'health_records_officer', 'admin'];
const PATIENT_READ = ['health_manager', 'health_worker', 'health_records_officer', 'admin'];
const CAMPAIGN_MANAGER = ['health_manager', 'admin'];
const CAMPAIGN_READ = ['health_manager', 'health_worker', 'admin'];

// ============================================================================
// Dashboard
// ============================================================================

/**
 * GET /api/health/dashboard
 * Returns health module metrics.
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker', 'pharmacy_tech', 'health_records_officer'),
  async (req, res, next) => {
    try {
      const metrics = await healthService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Inventory
// ============================================================================

/**
 * GET /api/health/inventory
 * List inventory items with optional filters.
 * Query params: category, lowStock, expiring, page, limit
 */
router.get(
  '/inventory',
  authenticate,
  authorize(...INVENTORY_READ),
  async (req, res, next) => {
    try {
      const result = await healthService.listInventoryItems(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/inventory/items
 * Create a new inventory item.
 */
router.post(
  '/inventory/items',
  authenticate,
  authorize(...INVENTORY_MANAGER),
  async (req, res, next) => {
    try {
      const item = await healthService.createInventoryItem(req.body);
      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/inventory/items/:id
 * Update an inventory item.
 */
router.put(
  '/inventory/items/:id',
  authenticate,
  authorize(...INVENTORY_MANAGER),
  async (req, res, next) => {
    try {
      const item = await healthService.updateInventoryItem(req.params.id, req.body);
      res.json({ item });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/inventory/transactions
 * Record a stock movement (receipt, issue, adjustment, return).
 */
router.post(
  '/inventory/transactions',
  authenticate,
  authorize(...INVENTORY_MANAGER),
  async (req, res, next) => {
    try {
      const transaction = await healthService.recordTransaction({
        ...req.body,
        created_by: req.user.id,
      });
      res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/inventory/stock-alerts
 * Get items below reorder level or expiring within 30 days.
 */
router.get(
  '/inventory/stock-alerts',
  authenticate,
  authorize(...INVENTORY_READ),
  async (req, res, next) => {
    try {
      const alerts = await healthService.getStockAlerts();
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Suppliers
// ============================================================================

/**
 * GET /api/health/suppliers
 * List all active suppliers.
 */
router.get(
  '/suppliers',
  authenticate,
  authorize(...INVENTORY_READ),
  async (req, res, next) => {
    try {
      const { HealthSupplier } = require('../models');
      const suppliers = await HealthSupplier.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });
      res.json({ suppliers });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/suppliers
 * Create a new supplier.
 */
router.post(
  '/suppliers',
  authenticate,
  authorize(...INVENTORY_MANAGER),
  async (req, res, next) => {
    try {
      const { HealthSupplier } = require('../models');
      const supplier = await HealthSupplier.create(req.body);
      res.status(201).json({ supplier });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Patients
// ============================================================================

/**
 * POST /api/health/patients
 * Register a new patient.
 */
router.post(
  '/patients',
  authenticate,
  authorize(...PATIENT_WRITE),
  async (req, res, next) => {
    try {
      const patient = await healthService.registerPatient(req.body);
      res.status(201).json({ patient });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/patients
 * List patients with search.
 * Query params: search, page, limit
 */
router.get(
  '/patients',
  authenticate,
  authorize(...PATIENT_READ),
  async (req, res, next) => {
    try {
      const result = await healthService.listPatients(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/patients/:id
 * Get patient details with visit history.
 */
router.get(
  '/patients/:id',
  authenticate,
  authorize(...PATIENT_READ),
  async (req, res, next) => {
    try {
      const patient = await healthService.getPatient(req.params.id);
      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/patients/:id
 * Update patient information.
 */
router.put(
  '/patients/:id',
  authenticate,
  authorize(...PATIENT_WRITE),
  async (req, res, next) => {
    try {
      const patient = await healthService.updatePatient(req.params.id, req.body);
      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Visits
// ============================================================================

/**
 * POST /api/health/visits
 * Record a patient visit.
 */
router.post(
  '/visits',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker'),
  async (req, res, next) => {
    try {
      const visit = await healthService.recordVisit({
        ...req.body,
        created_by: req.user.id,
      });
      res.status(201).json({ visit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/visits
 * List visits with filters.
 * Query params: patient_id, facility_type, start_date, end_date, page, limit
 */
router.get(
  '/visits',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker', 'health_records_officer'),
  async (req, res, next) => {
    try {
      const result = await healthService.listVisits(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Appointments
// ============================================================================

/**
 * POST /api/health/appointments
 * Schedule a new appointment.
 */
router.post(
  '/appointments',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker'),
  async (req, res, next) => {
    try {
      const appointment = await healthService.createAppointment(req.body);
      res.status(201).json({ appointment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/appointments
 * List appointments with filters.
 * Query params: doctor_id, status, upcoming, page, limit
 */
router.get(
  '/appointments',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker', 'health_records_officer'),
  async (req, res, next) => {
    try {
      const result = await healthService.listAppointments(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Campaigns
// ============================================================================

/**
 * POST /api/health/campaigns
 * Create a new campaign (health_manager or admin only).
 */
router.post(
  '/campaigns',
  authenticate,
  authorize(...CAMPAIGN_MANAGER),
  async (req, res, next) => {
    try {
      const campaign = await healthService.createCampaign(req.body);
      res.status(201).json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/campaigns
 * List campaigns.
 * Query params: campaign_type, page, limit
 */
router.get(
  '/campaigns',
  authenticate,
  authorize(...CAMPAIGN_READ),
  async (req, res, next) => {
    try {
      const result = await healthService.listCampaigns(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/campaigns/:id/coverage
 * Get campaign coverage statistics.
 */
router.get(
  '/campaigns/:id/coverage',
  authenticate,
  authorize(...CAMPAIGN_MANAGER),
  async (req, res, next) => {
    try {
      const coverage = await healthService.getCampaignCoverage(req.params.id);
      res.json(coverage);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/campaigns/:id/participants
 * Log a participant for a campaign.
 */
router.post(
  '/campaigns/:id/participants',
  authenticate,
  authorize(...CAMPAIGN_MANAGER),
  async (req, res, next) => {
    try {
      const participant = await healthService.addCampaignParticipant({
        campaign_id: req.params.id,
        ...req.body,
      });
      res.status(201).json({ participant });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Ambulance Requests
// ============================================================================

/**
 * POST /api/health/ambulance/requests
 * Request an ambulance.
 */
router.post(
  '/ambulance/requests',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker'),
  async (req, res, next) => {
    try {
      const request = await healthService.requestAmbulance(req.body);
      res.status(201).json({ request });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/ambulance/requests
 * List ambulance requests.
 * Query params: status, page, limit
 */
router.get(
  '/ambulance/requests',
  authenticate,
  authorize('admin', 'health_manager', 'health_worker'),
  async (req, res, next) => {
    try {
      const result = await healthService.listAmbulanceRequests(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/ambulance/requests/:id/status
 * Update ambulance request status.
 */
router.put(
  '/ambulance/requests/:id/status',
  authenticate,
  authorize('admin', 'health_manager'),
  async (req, res, next) => {
    try {
      const request = await healthService.updateAmbulanceStatus(req.params.id, req.body);
      res.json({ request });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Reports
// ============================================================================

/**
 * GET /api/health/reports/inventory-usage
 * Inventory usage report (health_manager, admin).
 */
router.get(
  '/reports/inventory-usage',
  authenticate,
  authorize('admin', 'health_manager', 'health_records_officer'),
  async (req, res, next) => {
    try {
      const { HealthInventoryTransaction, HealthInventoryItem } = require('../models');
      const { Op } = require('sequelize');
      const { start_date, end_date } = req.query;

      const where = {};
      if (start_date || end_date) {
        where.createdAt = {};
        if (start_date) where.createdAt[Op.gte] = new Date(start_date);
        if (end_date) where.createdAt[Op.lte] = new Date(end_date);
      }

      const transactions = await HealthInventoryTransaction.findAll({
        where,
        include: [
          { model: HealthInventoryItem, as: 'item', attributes: ['id', 'name', 'code', 'category'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({ transactions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/reports/patient-visits
 * Patient visits summary report.
 */
router.get(
  '/reports/patient-visits',
  authenticate,
  authorize('admin', 'health_manager', 'health_records_officer'),
  async (req, res, next) => {
    try {
      const { HealthPatientVisit, HealthPatient } = require('../models');
      const { Op } = require('sequelize');
      const { start_date, end_date } = req.query;

      const where = {};
      if (start_date || end_date) {
        where.visit_date = {};
        if (start_date) where.visit_date[Op.gte] = start_date;
        if (end_date) where.visit_date[Op.lte] = end_date;
      }

      const visits = await HealthPatientVisit.findAll({
        where,
        include: [
          { model: HealthPatient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'gender', 'village'] },
        ],
        order: [['visit_date', 'DESC']],
      });

      // Summary stats
      const totalVisits = visits.length;
      const byFacilityType = {};
      const byGender = {};

      for (const v of visits) {
        byFacilityType[v.facility_type] = (byFacilityType[v.facility_type] || 0) + 1;
        if (v.patient?.gender) {
          byGender[v.patient.gender] = (byGender[v.patient.gender] || 0) + 1;
        }
      }

      res.json({
        totalVisits,
        byFacilityType,
        byGender,
        visits,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
