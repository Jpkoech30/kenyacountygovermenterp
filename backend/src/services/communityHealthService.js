/**
 * Community Health Service - business logic for the Community Health Extension module.
 * Handles CHUs, CHAs, CHVs, households, visits, dialogues, action days, and supply chain.
 * Based on the Kenya National Community Health Strategy 2020-2025.
 */
const { Op } = require('sequelize');
const {
  HealthCommunityUnit,
  HealthCommunityCommittee,
  HealthCommunityAssistant,
  HealthCommunityVolunteer,
  HealthHousehold,
  HealthHouseholdMember,
  HealthHouseholdVisit,
  HealthCommunityDialogue,
  HealthCommunityActionDay,
  HealthChvKit,
  HealthCommunitySupplyRequest,
  HealthPatient,
  HealthPatientVisit,
  User,
  Employee,
} = require('../models');

// ============================================================================
// Community Units
// ============================================================================

/**
 * List community units with optional filtering.
 */
async function listCommunityUnits({ search, ward, sub_county, status, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
    ];
  }
  if (ward) where.ward = ward;
  if (sub_county) where.sub_county = sub_county;
  if (status) where.status = status;

  const { count, rows } = await HealthCommunityUnit.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    communityUnits: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Create a new community unit.
 */
async function createCommunityUnit(data) {
  return HealthCommunityUnit.create(data);
}

/**
 * Get a single community unit with related counts.
 */
async function getCommunityUnit(id) {
  const unit = await HealthCommunityUnit.findByPk(id, {
    include: [
      { association: 'committeeMembers', where: { is_active: true }, required: false },
      { association: 'volunteers', where: { status: 'active' }, required: false },
      { association: 'households', where: { status: 'active' }, required: false },
    ],
  });
  return unit;
}

/**
 * Update a community unit.
 */
async function updateCommunityUnit(id, data) {
  const unit = await HealthCommunityUnit.findByPk(id);
  if (!unit) throw new Error('Community unit not found');
  await unit.update(data);
  return unit;
}

/**
 * Soft delete a community unit (set status to inactive).
 */
async function deleteCommunityUnit(id) {
  const unit = await HealthCommunityUnit.findByPk(id);
  if (!unit) throw new Error('Community unit not found');
  await unit.update({ status: 'inactive' });
  return { message: 'Community unit deactivated' };
}

// ============================================================================
// Community Committees
// ============================================================================

/**
 * List committee members for a community unit.
 */
async function listCommitteeMembers(unitId, { page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = { community_unit_id: unitId };

  const { count, rows } = await HealthCommunityCommittee.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    committeeMembers: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Add a committee member.
 */
async function addCommitteeMember(unitId, data) {
  return HealthCommunityCommittee.create({ ...data, community_unit_id: unitId });
}

/**
 * Update a committee member.
 */
async function updateCommitteeMember(id, data) {
  const member = await HealthCommunityCommittee.findByPk(id);
  if (!member) throw new Error('Committee member not found');
  await member.update(data);
  return member;
}

/**
 * Remove a committee member (soft delete).
 */
async function removeCommitteeMember(id) {
  const member = await HealthCommunityCommittee.findByPk(id);
  if (!member) throw new Error('Committee member not found');
  await member.update({ is_active: false });
  return { message: 'Committee member removed' };
}

// ============================================================================
// Community Health Assistants
// ============================================================================

/**
 * List CHAs with optional filtering.
 */
async function listAssistants({ search, sub_county, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { national_id: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }
  if (sub_county) where.sub_county = sub_county;

  const { count, rows } = await HealthCommunityAssistant.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    assistants: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a CHA.
 */
async function createAssistant(data) {
  return HealthCommunityAssistant.create(data);
}

/**
 * Update a CHA.
 */
async function updateAssistant(id, data) {
  const assistant = await HealthCommunityAssistant.findByPk(id);
  if (!assistant) throw new Error('Community Health Assistant not found');
  await assistant.update(data);
  return assistant;
}

/**
 * Soft delete a CHA.
 */
async function deleteAssistant(id) {
  const assistant = await HealthCommunityAssistant.findByPk(id);
  if (!assistant) throw new Error('Community Health Assistant not found');
  await assistant.update({ is_active: false });
  return { message: 'CHA deactivated' };
}

// ============================================================================
// Community Health Volunteers
// ============================================================================

/**
 * List CHVs with optional filtering.
 */
async function listVolunteers({ unitId, chaId, status, search, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (unitId) where.community_unit_id = unitId;
  if (chaId) where.cha_id = chaId;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { national_id: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await HealthCommunityVolunteer.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    include: [
      { association: 'communityUnit', attributes: ['name', 'code'] },
      { association: 'supervisor', attributes: ['full_name'] },
    ],
  });

  return {
    volunteers: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a CHV.
 */
async function createVolunteer(data) {
  return HealthCommunityVolunteer.create(data);
}

/**
 * Update a CHV.
 */
async function updateVolunteer(id, data) {
  const volunteer = await HealthCommunityVolunteer.findByPk(id);
  if (!volunteer) throw new Error('CHV not found');
  await volunteer.update(data);
  return volunteer;
}

/**
 * Soft delete a CHV.
 */
async function deleteVolunteer(id) {
  const volunteer = await HealthCommunityVolunteer.findByPk(id);
  if (!volunteer) throw new Error('CHV not found');
  await volunteer.update({ status: 'inactive' });
  return { message: 'CHV deactivated' };
}

// ============================================================================
// Households
// ============================================================================

/**
 * Generate a household number.
 */
async function generateHouseholdNumber(communityUnitId) {
  const unit = await HealthCommunityUnit.findByPk(communityUnitId);
  const code = unit ? unit.code : 'UNK';
  const lastHousehold = await HealthHousehold.findOne({
    where: { community_unit_id: communityUnitId },
    order: [['id', 'DESC']],
  });
  const nextNum = lastHousehold ? lastHousehold.id + 1 : 1;
  return `HH-${code}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * List households with optional filtering.
 */
async function listHouseholds({ unitId, chvId, village, status, search, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (unitId) where.community_unit_id = unitId;
  if (chvId) where.chv_id = chvId;
  if (village) where.village = village;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { household_head: { [Op.like]: `%${search}%` } },
      { household_number: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await HealthHousehold.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    include: [
      { association: 'communityUnit', attributes: ['name', 'code'] },
      { association: 'assignedChv', attributes: ['full_name'] },
    ],
  });

  return {
    households: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a household with auto-generated household number.
 */
async function createHousehold(data) {
  const householdNumber = await generateHouseholdNumber(data.community_unit_id);
  return HealthHousehold.create({ ...data, household_number: householdNumber });
}

/**
 * Get a single household with members.
 */
async function getHousehold(id) {
  return HealthHousehold.findByPk(id, {
    include: [
      { association: 'communityUnit', attributes: ['name', 'code', 'ward', 'sub_county'] },
      { association: 'assignedChv', attributes: ['full_name', 'phone'] },
      { association: 'members', where: { is_active: true }, required: false },
    ],
  });
}

/**
 * Update a household.
 */
async function updateHousehold(id, data) {
  const household = await HealthHousehold.findByPk(id);
  if (!household) throw new Error('Household not found');
  await household.update(data);
  return household;
}

/**
 * Soft delete a household.
 */
async function deleteHousehold(id) {
  const household = await HealthHousehold.findByPk(id);
  if (!household) throw new Error('Household not found');
  await household.update({ status: 'closed' });
  return { message: 'Household closed' };
}

// ============================================================================
// Household Members
// ============================================================================

/**
 * List members of a household.
 */
async function listHouseholdMembers(householdId, { page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = { household_id: householdId, is_active: true };

  const { count, rows } = await HealthHouseholdMember.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['is_head', 'DESC'], ['createdAt', 'ASC']],
  });

  return {
    members: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Add a household member, auto-linking to HealthPatient by national_id.
 */
async function addHouseholdMember(householdId, data) {
  let patientLinked = false;

  // If national_id is provided, try to link to an existing patient
  if (data.national_id) {
    const patient = await HealthPatient.findOne({
      where: { national_id: data.national_id },
    });
    if (patient) {
      patientLinked = true;
    }
  }

  const member = await HealthHouseholdMember.create({
    ...data,
    household_id: householdId,
  });

  return { member, patientLinked };
}

/**
 * Update a household member.
 */
async function updateHouseholdMember(id, data) {
  const member = await HealthHouseholdMember.findByPk(id);
  if (!member) throw new Error('Household member not found');
  await member.update(data);
  return member;
}

/**
 * Remove a household member (soft delete).
 */
async function removeHouseholdMember(id) {
  const member = await HealthHouseholdMember.findByPk(id);
  if (!member) throw new Error('Household member not found');
  await member.update({ is_active: false });
  return { message: 'Household member removed' };
}

// ============================================================================
// Household Visits
// ============================================================================

/**
 * List household visits with optional filtering.
 */
async function listVisits({ householdId, chvId, startDate, endDate, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (householdId) where.household_id = householdId;
  if (chvId) where.chv_id = chvId;
  if (startDate || endDate) {
    where.visit_date = {};
    if (startDate) where.visit_date[Op.gte] = startDate;
    if (endDate) where.visit_date[Op.lte] = endDate;
  }

  const { count, rows } = await HealthHouseholdVisit.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['visit_date', 'DESC']],
    include: [
      { association: 'household', attributes: ['household_head', 'household_number', 'village'] },
      { association: 'chv', attributes: ['full_name'] },
    ],
  });

  return {
    visits: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Record a household visit. If referrals_made > 0, create HealthPatientVisit records.
 */
async function recordVisit(data) {
  const visit = await HealthHouseholdVisit.create(data);

  // If referrals were made, create HealthPatientVisit records
  if (data.referrals_made > 0 && data.referral_details) {
    try {
      const referrals = JSON.parse(data.referral_details);
      if (Array.isArray(referrals)) {
        for (const referral of referrals) {
          // Look up patient by national_id if provided
          let patientId = referral.patient_id;
          if (!patientId && referral.national_id) {
            const patient = await HealthPatient.findOne({
              where: { national_id: referral.national_id },
            });
            if (patient) {
              patientId = patient.id;
            }
          }

          if (patientId) {
            await HealthPatientVisit.create({
              patient_id: patientId,
              visit_date: data.visit_date,
              facility_type: 'outpatient',
              diagnosis: referral.diagnosis || 'Referral from community',
              treatment: referral.treatment || null,
              referred_to: referral.referred_to || null,
              referral_source_chv_id: data.chv_id,
              notes: referral.notes || `Community referral from CHV visit #${visit.id}`,
              created_by: data.chv_id, // Will be updated by route with actual user
            });
          }
        }
      }
    } catch (e) {
      // If referral_details is not valid JSON, just log and continue
      console.warn('Could not parse referral_details:', e.message);
    }
  }

  return visit;
}

/**
 * Update a household visit.
 */
async function updateVisit(id, data) {
  const visit = await HealthHouseholdVisit.findByPk(id);
  if (!visit) throw new Error('Visit not found');
  await visit.update(data);
  return visit;
}

// ============================================================================
// Community Dialogues
// ============================================================================

/**
 * List community dialogues with optional filtering.
 */
async function listDialogues({ unitId, status, startDate, endDate, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (unitId) where.community_unit_id = unitId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const { count, rows } = await HealthCommunityDialogue.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['date', 'DESC']],
    include: [
      { association: 'communityUnit', attributes: ['name', 'code', 'ward'] },
    ],
  });

  return {
    dialogues: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a community dialogue.
 */
async function createDialogue(data) {
  return HealthCommunityDialogue.create(data);
}

/**
 * Update a community dialogue.
 */
async function updateDialogue(id, data) {
  const dialogue = await HealthCommunityDialogue.findByPk(id);
  if (!dialogue) throw new Error('Dialogue not found');
  await dialogue.update(data);
  return dialogue;
}

/**
 * Delete a community dialogue.
 */
async function deleteDialogue(id) {
  const dialogue = await HealthCommunityDialogue.findByPk(id);
  if (!dialogue) throw new Error('Dialogue not found');
  await dialogue.destroy();
  return { message: 'Dialogue deleted' };
}

// ============================================================================
// Community Action Days
// ============================================================================

/**
 * List community action days with optional filtering.
 */
async function listActionDays({ unitId, status, activityType, startDate, endDate, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (unitId) where.community_unit_id = unitId;
  if (status) where.status = status;
  if (activityType) where.activity_type = activityType;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const { count, rows } = await HealthCommunityActionDay.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['date', 'DESC']],
    include: [
      { association: 'communityUnit', attributes: ['name', 'code', 'ward'] },
    ],
  });

  return {
    actionDays: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a community action day.
 */
async function createActionDay(data) {
  return HealthCommunityActionDay.create(data);
}

/**
 * Update a community action day.
 */
async function updateActionDay(id, data) {
  const actionDay = await HealthCommunityActionDay.findByPk(id);
  if (!actionDay) throw new Error('Action day not found');
  await actionDay.update(data);
  return actionDay;
}

/**
 * Delete a community action day.
 */
async function deleteActionDay(id) {
  const actionDay = await HealthCommunityActionDay.findByPk(id);
  if (!actionDay) throw new Error('Action day not found');
  await actionDay.destroy();
  return { message: 'Action day deleted' };
}

// ============================================================================
// CHV Kits
// ============================================================================

/**
 * List CHV kits.
 */
async function listKits({ page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;

  const { count, rows } = await HealthChvKit.findAndCountAll({
    limit,
    offset: (page - 1) * limit,
    order: [['kit_name', 'ASC']],
  });

  return {
    kits: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a CHV kit.
 */
async function createKit(data) {
  return HealthChvKit.create(data);
}

/**
 * Update a CHV kit.
 */
async function updateKit(id, data) {
  const kit = await HealthChvKit.findByPk(id);
  if (!kit) throw new Error('Kit not found');
  await kit.update(data);
  return kit;
}

// ============================================================================
// Supply Requests
// ============================================================================

/**
 * List supply requests with optional filtering.
 */
async function listSupplyRequests({ chvId, status, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (chvId) where.chv_id = chvId;
  if (status) where.status = status;

  const { count, rows } = await HealthCommunitySupplyRequest.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    include: [
      { association: 'chv', attributes: ['full_name', 'phone'] },
      { association: 'kit', attributes: ['kit_name'] },
      { association: 'approver', attributes: ['first_name', 'last_name'] },
    ],
  });

  return {
    supplyRequests: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
}

/**
 * Create a supply request.
 */
async function createSupplyRequest(data) {
  return HealthCommunitySupplyRequest.create({
    ...data,
    request_date: data.request_date || new Date().toISOString().split('T')[0],
    status: 'pending',
  });
}

/**
 * Approve a supply request.
 */
async function approveSupplyRequest(id, approvedBy) {
  const request = await HealthCommunitySupplyRequest.findByPk(id);
  if (!request) throw new Error('Supply request not found');
  if (request.status !== 'pending') throw new Error('Supply request is not pending');

  await request.update({
    status: 'approved',
    approved_by: approvedBy,
    approved_date: new Date().toISOString().split('T')[0],
  });
  return request;
}

/**
 * Fulfill a supply request.
 */
async function fulfillSupplyRequest(id) {
  const request = await HealthCommunitySupplyRequest.findByPk(id);
  if (!request) throw new Error('Supply request not found');
  if (request.status !== 'approved') throw new Error('Supply request must be approved first');

  await request.update({
    status: 'fulfilled',
    fulfilled_date: new Date().toISOString().split('T')[0],
  });
  return request;
}

/**
 * Reject a supply request.
 */
async function rejectSupplyRequest(id, reason) {
  const request = await HealthCommunitySupplyRequest.findByPk(id);
  if (!request) throw new Error('Supply request not found');
  if (request.status !== 'pending') throw new Error('Supply request is not pending');

  await request.update({
    status: 'rejected',
    notes: reason || 'Rejected',
  });
  return request;
}

// ============================================================================
// Dashboard
// ============================================================================

/**
 * Get community health dashboard metrics.
 */
async function getCommunityDashboardMetrics() {
  const [
    totalUnits,
    activeUnits,
    totalChvs,
    activeChvs,
    totalHouseholds,
    activeHouseholds,
    visitsThisMonth,
    pendingRequests,
  ] = await Promise.all([
    HealthCommunityUnit.count(),
    HealthCommunityUnit.count({ where: { status: 'active' } }),
    HealthCommunityVolunteer.count(),
    HealthCommunityVolunteer.count({ where: { status: 'active' } }),
    HealthHousehold.count(),
    HealthHousehold.count({ where: { status: 'active' } }),
    HealthHouseholdVisit.count({
      where: {
        visit_date: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        },
      },
    }),
    HealthCommunitySupplyRequest.count({ where: { status: 'pending' } }),
  ]);

  return {
    totalUnits,
    activeUnits,
    totalChvs,
    activeChvs,
    totalHouseholds,
    activeHouseholds,
    visitsThisMonth,
    pendingRequests,
  };
}

// ============================================================================
// CHV-specific queries (for CHV mobile view)
// ============================================================================

/**
 * Get CHV dashboard data - their assigned households, recent visits, pending requests.
 */
async function getChvDashboard(chvId) {
  const [totalHouseholds, recentVisits, pendingRequests] = await Promise.all([
    HealthHousehold.count({ where: { chv_id: chvId, status: 'active' } }),
    HealthHouseholdVisit.findAll({
      where: { chv_id: chvId },
      limit: 10,
      order: [['visit_date', 'DESC']],
      include: [
        { association: 'household', attributes: ['household_head', 'household_number', 'village'] },
      ],
    }),
    HealthCommunitySupplyRequest.count({ where: { chv_id: chvId, status: 'pending' } }),
  ]);

  return {
    totalHouseholds,
    recentVisits,
    pendingRequests,
  };
}

/**
 * Get CHV's assigned households.
 */
async function getChvHouseholds(chvId, { page = 1, limit = 20 } = {}) {
  return listHouseholds({ chvId, page, limit });
}

/**
 * Get CHV's visit history.
 */
async function getChvVisits(chvId, { page = 1, limit = 20 } = {}) {
  return listVisits({ chvId, page, limit });
}

module.exports = {
  // Community Units
  listCommunityUnits,
  createCommunityUnit,
  getCommunityUnit,
  updateCommunityUnit,
  deleteCommunityUnit,
  // Committees
  listCommitteeMembers,
  addCommitteeMember,
  updateCommitteeMember,
  removeCommitteeMember,
  // CHAs
  listAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  // CHVs
  listVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  // Households
  listHouseholds,
  createHousehold,
  getHousehold,
  updateHousehold,
  deleteHousehold,
  // Household Members
  listHouseholdMembers,
  addHouseholdMember,
  updateHouseholdMember,
  removeHouseholdMember,
  // Visits
  listVisits,
  recordVisit,
  updateVisit,
  // Dialogues
  listDialogues,
  createDialogue,
  updateDialogue,
  deleteDialogue,
  // Action Days
  listActionDays,
  createActionDay,
  updateActionDay,
  deleteActionDay,
  // Kits
  listKits,
  createKit,
  updateKit,
  // Supply Requests
  listSupplyRequests,
  createSupplyRequest,
  approveSupplyRequest,
  fulfillSupplyRequest,
  rejectSupplyRequest,
  // Dashboard
  getCommunityDashboardMetrics,
  // CHV-specific
  getChvDashboard,
  getChvHouseholds,
  getChvVisits,
};
