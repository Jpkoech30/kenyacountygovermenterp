/**
 * Permit Service - business logic for permit lifecycle.
 * Handles permit ID generation, status transitions, and QR code generation.
 */
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { Permit, PermitAssignment, Transaction, PermitType, User } = require('../models');
const pdfService = require('./pdfService');
const mpesaService = require('./mpesaService');

// ---------------------------------------------------------------------------
// Permit ID Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique human-readable permit ID.
 * Format: SBP-XXXXXX (6 hex chars = ~16M combinations)
 * @returns {string}
 */
function generatePermitId() {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SBP-${suffix}`;
}

// ---------------------------------------------------------------------------
// QR Code Generation
// ---------------------------------------------------------------------------

/**
 * Generate a QR code PNG file for a permit.
 * The QR encodes the verification URL.
 *
 * @param {Object} permit - Permit record
 * @returns {Promise<string>} Path to the generated QR image
 */
async function generateQRCode(permit) {
  const verificationUrl = `https://westpokot.go.ke/verify/${permit.permit_id}`;
  const qrDir = path.join(__dirname, '..', '..', 'storage', 'qr_codes');

  // Ensure directory exists
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }

  const filename = `permit_${permit.permit_id}.png`;
  const filepath = path.join(qrDir, filename);

  await QRCode.toFile(filepath, verificationUrl, {
    type: 'png',
    width: 300,
    margin: 2,
    color: { dark: '#003366', light: '#ffffff' },
  });

  return filepath;
}

/**
 * Generate QR code as base64 data URL (for frontend preview).
 * @param {string} permitId
 * @returns {Promise<string>}
 */
async function generateQRCodeDataURL(permitId) {
  const verificationUrl = `https://westpokot.go.ke/verify/${permitId}`;
  return await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#003366', light: '#ffffff' },
  });
}

// ---------------------------------------------------------------------------
// Permit Application
// ---------------------------------------------------------------------------

/**
 * Create a new permit draft application.
 *
 * @param {Object} data - Application form data
 * @param {Object} options
 * @param {number} [options.permitTypeId] - Override permit type (default: 1 = SBP)
 * @returns {Promise<Object>} Created permit
 */
async function applyForPermit(data, { permitTypeId = 1 } = {}) {
  // Find or assume the permit type
  const permitType = await PermitType.findByPk(permitTypeId);
  if (!permitType) {
    throw new Error('Permit type not found');
  }

  // Generate unique permit ID (retry on collision)
  let permitId;
  let attempts = 0;
  do {
    permitId = generatePermitId();
    const existing = await Permit.findOne({ where: { permit_id: permitId } });
    if (!existing) break;
    attempts++;
  } while (attempts < 5);

  if (attempts >= 5) {
    throw new Error('Failed to generate unique permit ID');
  }

  const permit = await Permit.create({
    permit_type_id: permitTypeId,
    permit_id: permitId,
    applicant_name: data.business_name,
    applicant_phone: data.phone,
    applicant_email: data.email,
    kra_pin: data.kra_pin,
    business_activity: data.business_activity,
    activity_code: data.activity_code,
    employee_size: data.employee_size || 1,
    fee_paid: permitType.fee,
    sub_county: data.sub_county,
    ward: data.ward,
    plot_no: data.plot_no,
    road_street: data.road_street,
    building: data.building,
    floor: data.floor,
    door_stall_no: data.door_stall_no,
    status: 'draft',
  });

  return permit;
}

// ---------------------------------------------------------------------------
// Payment Initiation
// ---------------------------------------------------------------------------

/**
 * Initiate M-Pesa payment for a permit.
 *
 * @param {number} permitId - Permit DB ID
 * @param {string} phoneNumber - Customer phone (2547XXXXXXXX)
 * @returns {Promise<Object>} { transaction, stkResponse }
 */
async function initiatePayment(permitId, phoneNumber) {
  const permit = await Permit.findByPk(permitId, {
    include: [{ model: PermitType, as: 'permitType' }],
  });

  if (!permit) throw new Error('Permit not found');
  if (permit.status !== 'draft') throw new Error('Permit is not in draft status');

  // Create transaction record
  const transaction = await Transaction.create({
    permit_id: permit.id,
    amount: parseFloat(permit.fee_paid),
    phone_number: phoneNumber,
    payment_status: 'pending',
  });

  // Initiate STK Push
  let stkResponse;
  try {
    stkResponse = await mpesaService.stkPush({
      phoneNumber,
      amount: parseFloat(permit.fee_paid),
      accountRef: permit.permit_id,
      transactionDesc: 'Business Permit Payment',
    });

    // Update transaction with merchant/checkout IDs
    transaction.merchant_request_id = stkResponse.MerchantRequestID || null;
    transaction.checkout_request_id = stkResponse.CheckoutRequestID || null;
    await transaction.save();

    // Update permit status
    permit.status = 'pending_payment';
    await permit.save();
  } catch (error) {
    transaction.payment_status = 'failed';
    await transaction.save();
    throw error;
  }

  return { transaction, stkResponse };
}

// ---------------------------------------------------------------------------
// Payment Callback Processing
// ---------------------------------------------------------------------------

/**
 * Process M-Pesa callback and update permit status.
 *
 * @param {Object} callbackBody - Safaricom callback JSON
 * @returns {Promise<Object>} Updated permit and transaction
 */
async function processPaymentCallback(callbackBody) {
  const result = mpesaService.processCallback(callbackBody);

  // Find the transaction by CheckoutRequestID
  const checkoutRequestId = callbackBody.Body?.stkCallback?.CheckoutRequestID;
  if (!checkoutRequestId) {
    throw new Error('Missing CheckoutRequestID in callback');
  }

  const transaction = await Transaction.findOne({
    where: { checkout_request_id: checkoutRequestId },
    include: [{ model: Permit, as: 'permit' }],
  });

  if (!transaction) {
    throw new Error(`Transaction not found for CheckoutRequestID: ${checkoutRequestId}`);
  }

  // Update transaction
  transaction.callback_payload = callbackBody;
  transaction.mpesa_receipt = result.receipt;
  transaction.payment_status = result.success ? 'completed' : 'failed';
  await transaction.save();

  // Update permit status
  const permit = transaction.permit;
  if (result.success) {
    permit.status = 'paid';
    await permit.save();

    // TODO: Send notification to revenue officers (in-app + email)
    // This would integrate with a notification service
    console.log(`✅ Payment received for permit ${permit.permit_id}. Receipt: ${result.receipt}`);
  }

  return { permit, transaction, result };
}

// ---------------------------------------------------------------------------
// Permit Issuance (Clerk)
// ---------------------------------------------------------------------------

/**
 * Issue a permit: generate QR code, generate PDF, update status.
 *
 * @param {number} permitId - Permit DB ID
 * @param {number} userId - Clerk user ID issuing the permit
 * @returns {Promise<Object>} Issued permit
 */
async function issuePermit(permitId, userId) {
  const permit = await Permit.findByPk(permitId, {
    include: [
      { model: PermitType, as: 'permitType' },
      { model: PermitAssignment, as: 'assignment' },
    ],
  });

  if (!permit) throw new Error('Permit not found');
  if (permit.status !== 'paid') throw new Error('Permit must be in paid status');

  // Set effective/expiry dates
  const effectiveDate = moment().startOf('day');
  const durationMonths = permit.permitType?.duration_months || 12;
  const expiryDate = moment(effectiveDate).add(durationMonths, 'months');

  permit.effective_date = effectiveDate.format('YYYY-MM-DD');
  permit.expiry_date = expiryDate.format('YYYY-MM-DD');
  permit.issued_by = userId;
  permit.issued_at = new Date();

  // Generate QR code
  const qrImagePath = await generateQRCode(permit);
  const qrDataURL = await generateQRCodeDataURL(permit.permit_id);
  permit.qr_code = qrDataURL;

  // Generate PDF
  const pdfBuffer = await pdfService.generatePermitPDF(permit, { qrImagePath });

  // TODO: Save PDF to media table
  // This would use the mediaService to store the PDF

  // Update status
  permit.status = 'active';
  await permit.save();

  // Mark assignment as completed
  if (permit.assignment) {
    permit.assignment.status = 'completed';
    permit.assignment.completed_at = new Date();
    await permit.assignment.save();
  }

  // Clean up temp QR file
  try {
    if (qrImagePath && fs.existsSync(qrImagePath)) {
      fs.unlinkSync(qrImagePath);
    }
  } catch (e) {
    console.warn('⚠️ Could not clean up QR temp file:', e.message);
  }

  return permit;
}

// ---------------------------------------------------------------------------
// Permit Renewal
// ---------------------------------------------------------------------------

/**
 * Renew a permit by creating a new record linked to the old one.
 *
 * @param {number} oldPermitId - Existing permit DB ID
 * @param {number} [userId] - User performing the renewal
 * @returns {Promise<Object>} New permit record
 */
async function renewPermit(oldPermitId, userId = null) {
  const oldPermit = await Permit.findByPk(oldPermitId, {
    include: [{ model: PermitType, as: 'permitType' }],
  });

  if (!oldPermit) throw new Error('Original permit not found');
  if (oldPermit.status !== 'active' && oldPermit.status !== 'expired') {
    throw new Error('Only active or expired permits can be renewed');
  }

  // Mark old as renewed
  oldPermit.status = 'renewed';
  await oldPermit.save();

  // Create new permit
  const newPermitId = generatePermitId();
  const newPermit = await Permit.create({
    permit_type_id: oldPermit.permit_type_id,
    permit_id: newPermitId,
    applicant_name: oldPermit.applicant_name,
    applicant_phone: oldPermit.applicant_phone,
    applicant_email: oldPermit.applicant_email,
    kra_pin: oldPermit.kra_pin,
    business_activity: oldPermit.business_activity,
    activity_code: oldPermit.activity_code,
    employee_size: oldPermit.employee_size,
    fee_paid: oldPermit.fee_paid,
    sub_county: oldPermit.sub_county,
    ward: oldPermit.ward,
    plot_no: oldPermit.plot_no,
    road_street: oldPermit.road_street,
    building: oldPermit.building,
    floor: oldPermit.floor,
    door_stall_no: oldPermit.door_stall_no,
    status: 'draft',
    renewed_from_id: oldPermit.id,
  });

  return newPermit;
}

// ---------------------------------------------------------------------------
// Bulk Assignment (Revenue Officer)
// ---------------------------------------------------------------------------

/**
 * Assign multiple paid permits to a clerk.
 *
 * @param {number[]} permitIds - Array of permit DB IDs
 * @param {number} clerkId - Clerk user ID
 * @param {number} assignedBy - Revenue officer user ID
 * @returns {Promise<Object[]>} Created assignments
 */
async function bulkAssign(permitIds, clerkId, assignedBy) {
  const assignments = [];

  for (const permitId of permitIds) {
    const permit = await Permit.findByPk(permitId);
    if (!permit || permit.status !== 'paid') continue;

    // Check if already assigned
    const existing = await PermitAssignment.findOne({ where: { permit_id: permitId } });
    if (existing) continue;

    const assignment = await PermitAssignment.create({
      permit_id: permitId,
      clerk_user_id: clerkId,
      assigned_by: assignedBy,
      status: 'pending',
    });

    assignments.push(assignment);
  }

  return assignments;
}

module.exports = {
  generatePermitId,
  generateQRCode,
  generateQRCodeDataURL,
  applyForPermit,
  initiatePayment,
  processPaymentCallback,
  issuePermit,
  renewPermit,
  bulkAssign,
};
