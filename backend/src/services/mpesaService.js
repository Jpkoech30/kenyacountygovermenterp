/**
 * M-Pesa Daraja API Integration Service.
 *
 * Handles:
 * - OAuth token generation (password grant)
 * - STK Push (Lipa Na M-Pesa Online)
 * - Callback processing
 *
 * Environment variables required:
 *   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY,
 *   MPESA_SHORTCODE, MPESA_CALLBACK_URL
 */
const axios = require('axios');
const moment = require('moment');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'test_key';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'test_secret';
const PASSKEY = process.env.MPESA_PASSKEY || 'test_passkey';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://westpokot.go.ke/api/mpesa/callback';

const MPESA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const MPESA_STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

// ---------------------------------------------------------------------------
// Cache the OAuth token (expires in 1 hour, refresh as needed)
// ---------------------------------------------------------------------------
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get an OAuth access token from Safaricom.
 * Uses cached token if still valid.
 * @returns {Promise<string>} Bearer token
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  try {
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000,
    });

    cachedToken = response.data.access_token;
    // Token expires in 3599 seconds; refresh after 3500s for safety
    tokenExpiry = Date.now() + 3500 * 1000;
    return cachedToken;
  } catch (error) {
    console.error('❌ M-Pesa OAuth failed:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

/**
 * Generate the STK Push password (Base64 encoded).
 * Format: SHORTCODE + PASSKEY + Timestamp (YYYYMMDDHHmmss)
 * @returns {{ password: string, timestamp: string }}
 */
function generatePassword() {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const raw = `${SHORTCODE}${PASSKEY}${timestamp}`;
  const password = Buffer.from(raw).toString('base64');
  return { password, timestamp };
}

/**
 * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
 *
 * @param {Object} options
 * @param {string} options.phoneNumber - Customer phone (2547XXXXXXXX)
 * @param {number} options.amount - Amount to charge (KES)
 * @param {string} options.accountRef - Reference (e.g., permit_id)
 * @param {string} options.transactionDesc - Description
 * @returns {Promise<Object>} STK Push response
 */
async function stkPush({ phoneNumber, amount, accountRef, transactionDesc = 'Business Permit Payment' }) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef.substring(0, 12),
    TransactionDesc: transactionDesc.substring(0, 13),
  };

  try {
    const response = await axios.post(MPESA_STK_URL, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });

    console.log('📱 M-Pesa STK Push sent:', response.data.ResponseDescription);
    return response.data;
  } catch (error) {
    console.error('❌ M-Pesa STK Push failed:', error.response?.data || error.message);
    throw new Error('STK Push request failed');
  }
}

/**
 * Process the callback payload from Safaricom.
 * Extracts receipt number, result code, and description.
 *
 * @param {Object} callbackBody - The JSON body from Safaricom callback
 * @returns {{ success: boolean, receipt: string|null, resultCode: number, resultDesc: string }}
 */
function processCallback(callbackBody) {
  const { Body } = callbackBody;
  if (!Body || !Body.stkCallback) {
    return { success: false, receipt: null, resultCode: -1, resultDesc: 'Invalid callback body' };
  }

  const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

  let receipt = null;
  if (CallbackMetadata && CallbackMetadata.Item) {
    const mpesaReceiptItem = CallbackMetadata.Item.find(
      (item) => item.Name === 'MpesaReceiptNumber'
    );
    if (mpesaReceiptItem) {
      receipt = mpesaReceiptItem.Value;
    }
  }

  return {
    success: ResultCode === 0,
    receipt,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
  };
}

module.exports = {
  getAccessToken,
  stkPush,
  processCallback,
};
