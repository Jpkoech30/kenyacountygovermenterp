/**
 * Health Service - business logic for the Health Facility Management module.
 * Handles inventory management, patient registration, visits, campaigns,
 * appointments, and ambulance dispatch.
 */
const { Op, col } = require('sequelize');
const {
  HealthInventoryItem,
  HealthInventoryTransaction,
  HealthSupplier,
  HealthPatient,
  HealthPatientVisit,
  HealthAppointment,
  HealthCampaign,
  HealthCampaignParticipant,
  HealthAmbulanceRequest,
  User,
  Employee,
} = require('../models');

// ============================================================================
// Inventory Management
// ============================================================================

/**
 * List inventory items with optional filtering.
 */
async function listInventoryItems({ category, lowStock, expiring, page = 1, limit = 20 } = {}) {
  const where = {};

  // Parse numeric params from query strings
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;

  if (category) {
    where.category = category;
  }

  if (lowStock === 'true' || lowStock === true) {
    where.current_stock = { [Op.lte]: col('reorder_level') };
  }

  if (expiring === 'true' || expiring === true) {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    where.expiry_date = {
      [Op.not]: null,
      [Op.lte]: thirtyDays.toISOString().split('T')[0],
    };
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthInventoryItem.findAndCountAll({
    where,
    include: [{ model: HealthSupplier, as: 'supplier' }],
    offset,
    limit,
    order: [['name', 'ASC']],
  });

  return {
    items: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Create a new inventory item.
 */
async function createInventoryItem(data) {
  return await HealthInventoryItem.create(data);
}

/**
 * Update an existing inventory item.
 */
async function updateInventoryItem(id, data) {
  const item = await HealthInventoryItem.findByPk(id);
  if (!item) {
    throw new Error('Inventory item not found');
  }
  await item.update(data);
  return item;
}

/**
 * Record a stock movement transaction.
 * Automatically adjusts the inventory item's current_stock.
 */
async function recordTransaction({ item_id, transaction_type, quantity, reference, notes, created_by }) {
  // Validate item exists
  const item = await HealthInventoryItem.findByPk(item_id);
  if (!item) {
    throw new Error('Inventory item not found');
  }

  // Calculate stock adjustment
  let stockChange = 0;
  switch (transaction_type) {
    case 'receipt':
    case 'return':
      stockChange = Math.abs(quantity);
      break;
    case 'issue':
      stockChange = -Math.abs(quantity);
      break;
    case 'adjustment':
      stockChange = quantity; // Can be positive or negative
      break;
    default:
      throw new Error('Invalid transaction type');
  }

  // Check if sufficient stock for issues
  if (stockChange < 0 && item.current_stock + stockChange < 0) {
    throw new Error(`Insufficient stock. Current: ${item.current_stock}, requested: ${Math.abs(quantity)}`);
  }

  // Create transaction record
  const transaction = await HealthInventoryTransaction.create({
    item_id,
    transaction_type,
    quantity: stockChange,
    reference,
    notes,
    created_by,
  });

  // Update item stock
  await item.update({
    current_stock: item.current_stock + stockChange,
  });

  return transaction;
}

/**
 * Get stock alerts - items below reorder level or expiring within 30 days.
 */
async function getStockAlerts() {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const expiryThreshold = thirtyDays.toISOString().split('T')[0];

  const lowStockItems = await HealthInventoryItem.findAll({
    where: {
      current_stock: { [Op.lte]: col('reorder_level') },
      is_active: true,
    },
    include: [{ model: HealthSupplier, as: 'supplier' }],
    order: [['current_stock', 'ASC']],
  });

  const expiringItems = await HealthInventoryItem.findAll({
    where: {
      expiry_date: {
        [Op.not]: null,
        [Op.lte]: expiryThreshold,
      },
      is_active: true,
    },
    include: [{ model: HealthSupplier, as: 'supplier' }],
    order: [['expiry_date', 'ASC']],
  });

  return { lowStockItems, expiringItems };
}

// ============================================================================
// Patient Management
// ============================================================================

/**
 * Calculate age from date of birth string (YYYY-MM-DD).
 * Returns age in years, or null if dateOfBirth is falsy.
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Look up parent details by national_id.
 * Returns { national_id, first_name, last_name, phone } or null.
 */
async function lookupParent(nationalId) {
  if (!nationalId) return null;
  const parent = await HealthPatient.findOne({
    where: { national_id: nationalId },
    attributes: ['national_id', 'first_name', 'last_name', 'phone'],
  });
  return parent || null;
}

/**
 * Find children of a patient by their national_id.
 * Returns array of { id, national_id, first_name, last_name, date_of_birth }.
 */
async function findChildren(nationalId) {
  if (!nationalId) return [];
  return await HealthPatient.findAll({
    where: {
      [Op.or]: [
        { mother_national_id: nationalId },
        { father_national_id: nationalId },
      ],
    },
    attributes: ['id', 'national_id', 'first_name', 'last_name', 'date_of_birth'],
  });
}

/**
 * Register a new patient.
 * Accepts mother_national_id and father_national_id (both optional).
 * Validates that minors (< 18) have at least one parent ID.
 */
async function registerPatient(data) {
  const age = calculateAge(data.date_of_birth);
  if (age !== null && age < 18) {
    if (!data.mother_national_id && !data.father_national_id) {
      const err = new Error('At least one parent\'s national ID is required for minors (age < 18).');
      err.status = 400;
      throw err;
    }
  }
  return await HealthPatient.create(data);
}

/**
 * List patients with search and optional parent ID filtering.
 * Query params: search, mother_national_id, father_national_id, page, limit
 */
async function listPatients({ search, mother_national_id, father_national_id, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;

  const where = {};

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { national_id: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter by mother_national_id (returns children of that mother)
  if (mother_national_id) {
    where.mother_national_id = mother_national_id;
  }

  // Filter by father_national_id (returns children of that father)
  if (father_national_id) {
    where.father_national_id = father_national_id;
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthPatient.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    patients: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get patient details with visit history, parent info, and children.
 * Includes:
 *   - mother: object (if mother_national_id matches a patient's national_id)
 *   - father: object (if father_national_id matches a patient's national_id)
 *   - children: array of patients where mother_national_id or father_national_id equals this patient's national_id
 */
async function getPatient(id) {
  const patient = await HealthPatient.findByPk(id, {
    include: [
      {
        model: HealthPatientVisit,
        as: 'visits',
        include: [{ model: User, as: 'createdBy', attributes: ['id', 'first_name', 'last_name'] }],
        order: [['visit_date', 'DESC']],
      },
      {
        model: HealthAppointment,
        as: 'appointments',
        order: [['appointment_date', 'DESC']],
      },
    ],
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Attach parent details and children
  const patientData = patient.toJSON();
  patientData.mother = await lookupParent(patient.mother_national_id);
  patientData.father = await lookupParent(patient.father_national_id);
  patientData.children = await findChildren(patient.national_id);

  return patientData;
}

/**
 * Update patient information.
 * Validates that minors (< 18) have at least one parent ID.
 */
async function updatePatient(id, data) {
  const patient = await HealthPatient.findByPk(id);
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Merge existing data with updates for age validation
  const dateOfBirth = data.date_of_birth || patient.date_of_birth;
  const motherId = data.mother_national_id !== undefined ? data.mother_national_id : patient.mother_national_id;
  const fatherId = data.father_national_id !== undefined ? data.father_national_id : patient.father_national_id;

  const age = calculateAge(dateOfBirth);
  if (age !== null && age < 18) {
    if (!motherId && !fatherId) {
      const err = new Error('At least one parent\'s national ID is required for minors (age < 18).');
      err.status = 400;
      throw err;
    }
  }

  await patient.update(data);
  return patient;
}

// ============================================================================
// Visits & Appointments
// ============================================================================

/**
 * Record a patient visit.
 */
async function recordVisit(data) {
  return await HealthPatientVisit.create(data);
}

/**
 * List visits with filters.
 */
async function listVisits({ patient_id, facility_type, start_date, end_date, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (patient_id) where.patient_id = patient_id;
  if (facility_type) where.facility_type = facility_type;
  if (start_date || end_date) {
    where.visit_date = {};
    if (start_date) where.visit_date[Op.gte] = start_date;
    if (end_date) where.visit_date[Op.lte] = end_date;
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthPatientVisit.findAndCountAll({
    where,
    include: [
      { model: HealthPatient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'national_id', 'phone'] },
      { model: User, as: 'createdBy', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['visit_date', 'DESC']],
  });

  return {
    visits: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Schedule an appointment.
 */
async function createAppointment(data) {
  return await HealthAppointment.create(data);
}

/**
 * List appointments with filters.
 */
async function listAppointments({ doctor_id, status, upcoming, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};

  if (doctor_id) where.doctor_id = doctor_id;
  if (status) where.status = status;

  if (upcoming === 'true' || upcoming === true) {
    where.appointment_date = { [Op.gte]: new Date() };
    where.status = 'scheduled';
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthAppointment.findAndCountAll({
    where,
    include: [
      { model: HealthPatient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'national_id', 'phone'] },
      { model: Employee, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['appointment_date', 'ASC']],
  });

  return {
    appointments: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

// ============================================================================
// Campaigns
// ============================================================================

/**
 * Create a new campaign.
 */
async function createCampaign(data) {
  return await HealthCampaign.create(data);
}

/**
 * List campaigns.
 */
async function listCampaigns({ campaign_type, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};
  if (campaign_type) where.campaign_type = campaign_type;

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthCampaign.findAndCountAll({
    where,
    offset,
    limit,
    order: [['start_date', 'DESC']],
  });

  return {
    campaigns: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get campaign coverage statistics.
 */
async function getCampaignCoverage(campaignId) {
  const campaign = await HealthCampaign.findByPk(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const participants = await HealthCampaignParticipant.findAll({
    where: { campaign_id: campaignId },
    include: [
      {
        model: HealthPatient,
        as: 'patient',
        attributes: ['id', 'first_name', 'last_name', 'village', 'sub_location_id'],
      },
    ],
  });

  // Group by location (village) for coverage stats
  const locationCoverage = {};
  for (const p of participants) {
    const location = p.patient?.village || 'Unknown';
    if (!locationCoverage[location]) {
      locationCoverage[location] = 0;
    }
    locationCoverage[location]++;
  }

  return {
    campaign,
    totalParticipants: participants.length,
    locationCoverage,
    participants,
  };
}

/**
 * Log a campaign participant.
 */
async function addCampaignParticipant(data) {
  return await HealthCampaignParticipant.create(data);
}

// ============================================================================
// Ambulance Requests
// ============================================================================

/**
 * Create an ambulance request.
 */
async function requestAmbulance(data) {
  return await HealthAmbulanceRequest.create(data);
}

/**
 * List ambulance requests.
 */
async function listAmbulanceRequests({ status, page = 1, limit = 20 } = {}) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  const where = {};
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await HealthAmbulanceRequest.findAndCountAll({
    where,
    include: [
      { model: HealthPatient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'phone'] },
      { model: Employee, as: 'assignedDriver', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['request_time', 'DESC']],
  });

  return {
    requests: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Update ambulance request status.
 */
async function updateAmbulanceStatus(id, data) {
  const request = await HealthAmbulanceRequest.findByPk(id);
  if (!request) {
    throw new Error('Ambulance request not found');
  }
  await request.update(data);
  return request;
}

// ============================================================================
// Dashboard / Reports
// ============================================================================

/**
 * Get health dashboard metrics.
 */
async function getDashboardMetrics() {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() - 30);

  const [
    totalItems,
    lowStockCount,
    totalPatients,
    recentVisits,
    activeCampaigns,
    pendingAmbulance,
  ] = await Promise.all([
    HealthInventoryItem.count({ where: { is_active: true } }),
    HealthInventoryItem.count({
      where: {
        is_active: true,
        current_stock: { [Op.lte]: col('reorder_level') },
      },
    }),
    HealthPatient.count({ where: { is_active: true } }),
    HealthPatientVisit.count({
      where: { visit_date: { [Op.gte]: thirtyDays.toISOString().split('T')[0] } },
    }),
    HealthCampaign.count({
      where: {
        is_active: true,
        end_date: { [Op.gte]: new Date().toISOString().split('T')[0] },
      },
    }),
    HealthAmbulanceRequest.count({ where: { status: 'pending' } }),
  ]);

  return {
    totalItems,
    lowStockCount,
    totalPatients,
    recentVisits,
    activeCampaigns,
    pendingAmbulance,
  };
}

module.exports = {
  // Inventory
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  recordTransaction,
  getStockAlerts,
  // Patients
  registerPatient,
  listPatients,
  getPatient,
  updatePatient,
  // Visits & Appointments
  recordVisit,
  listVisits,
  createAppointment,
  listAppointments,
  // Campaigns
  createCampaign,
  listCampaigns,
  getCampaignCoverage,
  addCampaignParticipant,
  // Ambulance
  requestAmbulance,
  listAmbulanceRequests,
  updateAmbulanceStatus,
  // Dashboard
  getDashboardMetrics,
};
