/**
 * Community Health Routes - Community Health Extension Module.
 * Mounted at /api/health/community.
 *
 * Role-based access:
 *   community_health_officer → Full admin access to community health features
 *   chv                    → CHV mobile view (own households, visits, supplies)
 *   health_manager         → Read access to community health data
 *   admin                  → Full access
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const communityHealthService = require('../services/communityHealthService');

// ── Helper: role arrays ──
const COMMUNITY_ADMIN = ['community_health_officer', 'admin'];
const COMMUNITY_READ = ['community_health_officer', 'chv', 'health_manager', 'admin'];
const CHV_WRITE = ['chv', 'community_health_officer', 'admin'];
const SUPPLY_MANAGER = ['community_health_officer', 'admin'];

// ============================================================================
// Dashboard
// ============================================================================

/**
 * GET /api/health/community/dashboard
 * Returns community health module metrics.
 */
router.get(
  '/dashboard',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const metrics = await communityHealthService.getCommunityDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Units
// ============================================================================

/**
 * GET /api/health/community/units
 * List community units with optional filters.
 */
router.get(
  '/units',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listCommunityUnits(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/units
 * Create a new community unit.
 */
router.post(
  '/units',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const unit = await communityHealthService.createCommunityUnit(req.body);
      res.status(201).json({ unit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/community/units/:id
 * Get a single community unit with details.
 */
router.get(
  '/units/:id',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const unit = await communityHealthService.getCommunityUnit(req.params.id);
      if (!unit) return res.status(404).json({ message: 'Community unit not found' });
      res.json({ unit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/units/:id
 * Update a community unit.
 */
router.put(
  '/units/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const unit = await communityHealthService.updateCommunityUnit(req.params.id, req.body);
      res.json({ unit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/units/:id
 * Soft delete a community unit.
 */
router.delete(
  '/units/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteCommunityUnit(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Committees
// ============================================================================

/**
 * GET /api/health/community/units/:unitId/committee
 * List committee members for a community unit.
 */
router.get(
  '/units/:unitId/committee',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listCommitteeMembers(req.params.unitId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/units/:unitId/committee
 * Add a committee member.
 */
router.post(
  '/units/:unitId/committee',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const member = await communityHealthService.addCommitteeMember(req.params.unitId, req.body);
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/committee/:id
 * Update a committee member.
 */
router.put(
  '/committee/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const member = await communityHealthService.updateCommitteeMember(req.params.id, req.body);
      res.json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/committee/:id
 * Remove a committee member.
 */
router.delete(
  '/committee/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.removeCommitteeMember(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Health Assistants
// ============================================================================

/**
 * GET /api/health/community/assistants
 * List CHAs with optional filters.
 */
router.get(
  '/assistants',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listAssistants(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/assistants
 * Create a new CHA.
 */
router.post(
  '/assistants',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const assistant = await communityHealthService.createAssistant(req.body);
      res.status(201).json({ assistant });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/assistants/:id
 * Update a CHA.
 */
router.put(
  '/assistants/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const assistant = await communityHealthService.updateAssistant(req.params.id, req.body);
      res.json({ assistant });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/assistants/:id
 * Soft delete a CHA.
 */
router.delete(
  '/assistants/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteAssistant(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Health Volunteers
// ============================================================================

/**
 * GET /api/health/community/volunteers
 * List CHVs with optional filters.
 */
router.get(
  '/volunteers',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listVolunteers(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/volunteers
 * Create a new CHV.
 */
router.post(
  '/volunteers',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const volunteer = await communityHealthService.createVolunteer(req.body);
      res.status(201).json({ volunteer });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/volunteers/:id
 * Update a CHV.
 */
router.put(
  '/volunteers/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const volunteer = await communityHealthService.updateVolunteer(req.params.id, req.body);
      res.json({ volunteer });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/volunteers/:id
 * Soft delete a CHV.
 */
router.delete(
  '/volunteers/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteVolunteer(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Households
// ============================================================================

/**
 * GET /api/health/community/households
 * List households with optional filters.
 */
router.get(
  '/households',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listHouseholds(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/households
 * Create a new household.
 */
router.post(
  '/households',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const household = await communityHealthService.createHousehold(req.body);
      res.status(201).json({ household });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/community/households/:id
 * Get a single household with members.
 */
router.get(
  '/households/:id',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const household = await communityHealthService.getHousehold(req.params.id);
      if (!household) return res.status(404).json({ message: 'Household not found' });
      res.json({ household });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/households/:id
 * Update a household.
 */
router.put(
  '/households/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const household = await communityHealthService.updateHousehold(req.params.id, req.body);
      res.json({ household });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/households/:id
 * Soft delete a household.
 */
router.delete(
  '/households/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteHousehold(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Household Members
// ============================================================================

/**
 * GET /api/health/community/households/:householdId/members
 * List members of a household.
 */
router.get(
  '/households/:householdId/members',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listHouseholdMembers(req.params.householdId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/households/:householdId/members
 * Add a household member.
 */
router.post(
  '/households/:householdId/members',
  authenticate,
  authorize(...CHV_WRITE),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.addHouseholdMember(req.params.householdId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/members/:id
 * Update a household member.
 */
router.put(
  '/members/:id',
  authenticate,
  authorize(...CHV_WRITE),
  async (req, res, next) => {
    try {
      const member = await communityHealthService.updateHouseholdMember(req.params.id, req.body);
      res.json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/members/:id
 * Remove a household member.
 */
router.delete(
  '/members/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.removeHouseholdMember(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Household Visits
// ============================================================================

/**
 * GET /api/health/community/visits
 * List household visits with optional filters.
 */
router.get(
  '/visits',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listVisits(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/visits
 * Record a household visit.
 */
router.post(
  '/visits',
  authenticate,
  authorize(...CHV_WRITE),
  async (req, res, next) => {
    try {
      const visit = await communityHealthService.recordVisit(req.body);
      res.status(201).json({ visit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/visits/:id
 * Update a household visit.
 */
router.put(
  '/visits/:id',
  authenticate,
  authorize(...CHV_WRITE),
  async (req, res, next) => {
    try {
      const visit = await communityHealthService.updateVisit(req.params.id, req.body);
      res.json({ visit });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Dialogues
// ============================================================================

/**
 * GET /api/health/community/dialogues
 * List community dialogues with optional filters.
 */
router.get(
  '/dialogues',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listDialogues(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/dialogues
 * Create a community dialogue.
 */
router.post(
  '/dialogues',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const dialogue = await communityHealthService.createDialogue(req.body);
      res.status(201).json({ dialogue });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/dialogues/:id
 * Update a community dialogue.
 */
router.put(
  '/dialogues/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const dialogue = await communityHealthService.updateDialogue(req.params.id, req.body);
      res.json({ dialogue });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/dialogues/:id
 * Delete a community dialogue.
 */
router.delete(
  '/dialogues/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteDialogue(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Community Action Days
// ============================================================================

/**
 * GET /api/health/community/action-days
 * List community action days with optional filters.
 */
router.get(
  '/action-days',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listActionDays(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/action-days
 * Create a community action day.
 */
router.post(
  '/action-days',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const actionDay = await communityHealthService.createActionDay(req.body);
      res.status(201).json({ actionDay });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/action-days/:id
 * Update a community action day.
 */
router.put(
  '/action-days/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const actionDay = await communityHealthService.updateActionDay(req.params.id, req.body);
      res.json({ actionDay });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/health/community/action-days/:id
 * Delete a community action day.
 */
router.delete(
  '/action-days/:id',
  authenticate,
  authorize(...COMMUNITY_ADMIN),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.deleteActionDay(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// CHV Kits
// ============================================================================

/**
 * GET /api/health/community/kits
 * List CHV kits.
 */
router.get(
  '/kits',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listKits(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/kits
 * Create a new CHV kit.
 */
router.post(
  '/kits',
  authenticate,
  authorize(...SUPPLY_MANAGER),
  async (req, res, next) => {
    try {
      const kit = await communityHealthService.createKit(req.body);
      res.status(201).json({ kit });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/kits/:id
 * Update a CHV kit.
 */
router.put(
  '/kits/:id',
  authenticate,
  authorize(...SUPPLY_MANAGER),
  async (req, res, next) => {
    try {
      const kit = await communityHealthService.updateKit(req.params.id, req.body);
      res.json({ kit });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Supply Requests
// ============================================================================

/**
 * GET /api/health/community/supply-requests
 * List supply requests with optional filters.
 */
router.get(
  '/supply-requests',
  authenticate,
  authorize(...COMMUNITY_READ),
  async (req, res, next) => {
    try {
      const result = await communityHealthService.listSupplyRequests(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/health/community/supply-requests
 * Create a supply request (CHV requests supplies).
 */
router.post(
  '/supply-requests',
  authenticate,
  authorize(...CHV_WRITE),
  async (req, res, next) => {
    try {
      const request = await communityHealthService.createSupplyRequest(req.body);
      res.status(201).json({ request });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/supply-requests/:id/approve
 * Approve a supply request.
 */
router.put(
  '/supply-requests/:id/approve',
  authenticate,
  authorize(...SUPPLY_MANAGER),
  async (req, res, next) => {
    try {
      const request = await communityHealthService.approveSupplyRequest(req.params.id, req.user.id);
      res.json({ request });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/supply-requests/:id/fulfill
 * Fulfill a supply request.
 */
router.put(
  '/supply-requests/:id/fulfill',
  authenticate,
  authorize(...SUPPLY_MANAGER),
  async (req, res, next) => {
    try {
      const request = await communityHealthService.fulfillSupplyRequest(req.params.id);
      res.json({ request });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/health/community/supply-requests/:id/reject
 * Reject a supply request.
 */
router.put(
  '/supply-requests/:id/reject',
  authenticate,
  authorize(...SUPPLY_MANAGER),
  async (req, res, next) => {
    try {
      const request = await communityHealthService.rejectSupplyRequest(req.params.id, req.body.reason);
      res.json({ request });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// CHV-specific endpoints (for CHV mobile view)
// ============================================================================

/**
 * GET /api/health/community/chv/dashboard
 * CHV's personal dashboard data.
 */
router.get(
  '/chv/dashboard',
  authenticate,
  authorize('chv'),
  async (req, res, next) => {
    try {
      // Find CHV by user_id
      const chv = await require('../models').HealthCommunityVolunteer.findOne({
        where: { user_id: req.user.id },
      });
      if (!chv) return res.status(404).json({ message: 'CHV profile not found. Link your user account to a CHV record.' });
      const dashboard = await communityHealthService.getChvDashboard(chv.id);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/community/chv/households
 * CHV's assigned households.
 */
router.get(
  '/chv/households',
  authenticate,
  authorize('chv'),
  async (req, res, next) => {
    try {
      const chv = await require('../models').HealthCommunityVolunteer.findOne({
        where: { user_id: req.user.id },
      });
      if (!chv) return res.status(404).json({ message: 'CHV profile not found' });
      const result = await communityHealthService.getChvHouseholds(chv.id, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/community/chv/visits
 * CHV's visit history.
 */
router.get(
  '/chv/visits',
  authenticate,
  authorize('chv'),
  async (req, res, next) => {
    try {
      const chv = await require('../models').HealthCommunityVolunteer.findOne({
        where: { user_id: req.user.id },
      });
      if (!chv) return res.status(404).json({ message: 'CHV profile not found' });
      const result = await communityHealthService.getChvVisits(chv.id, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
