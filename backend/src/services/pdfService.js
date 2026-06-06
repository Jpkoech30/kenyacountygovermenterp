/**
 * PDF Generation Service for Business Permits.
 * Uses PDFKit to generate A4 permit certificates with:
 * - County header and branding
 * - Business details (name, KRA PIN, activity)
 * - Fee, effective/expiry dates
 * - QR code image (embedded)
 * - County stamp placeholder
 */
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

/**
 * Generate a permit PDF as a Buffer.
 *
 * @param {Object} permit - Permit record with associations
 * @param {Object} options
 * @param {string} options.qrImagePath - Path to QR code PNG file
 * @param {string} options.countyLogoPath - Path to county logo (optional)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePermitPDF(permit, { qrImagePath, countyLogoPath } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // -----------------------------------------------------------------------
      // Header: County Name
      // -----------------------------------------------------------------------
      doc.fontSize(18).font('Helvetica-Bold').text('WEST POKOT COUNTY GOVERNMENT', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Department of Finance & Economic Planning', { align: 'center' });
      doc.moveDown(0.5);

      // Horizontal rule
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#003366');
      doc.moveDown(1);

      // -----------------------------------------------------------------------
      // Title
      // -----------------------------------------------------------------------
      doc.fontSize(22).font('Helvetica-Bold').text('SINGLE BUSINESS PERMIT', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Permit No: ${permit.permit_id}`, { align: 'center' });
      doc.moveDown(1.5);

      // -----------------------------------------------------------------------
      // Business Details Section
      // -----------------------------------------------------------------------
      const leftX = 70;
      const labelWidth = 130;
      const valueX = leftX + labelWidth;

      const addField = (label, value) => {
        doc.fontSize(11).font('Helvetica-Bold').text(label, leftX, doc.y, { width: labelWidth, continued: true });
        doc.font('Helvetica').text(`:  ${value || 'N/A'}`, { width: 400 });
        doc.moveDown(0.3);
      };

      addField('Business Name', permit.applicant_name);
      addField('KRA PIN', permit.kra_pin);
      addField('Business Activity', permit.business_activity);
      addField('Activity Code', permit.activity_code || 'N/A');
      addField('Employee Size', String(permit.employee_size || 1));
      addField('Sub-County', permit.sub_county || 'N/A');
      addField('Ward', permit.ward || 'N/A');
      addField('Location', [permit.plot_no, permit.road_street, permit.building, permit.floor, permit.door_stall_no].filter(Boolean).join(', ') || 'N/A');

      doc.moveDown(0.5);

      // -----------------------------------------------------------------------
      // Fee & Validity
      // -----------------------------------------------------------------------
      doc.moveTo(70, doc.y).lineTo(540, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);

      addField('Permit Fee (KES)', `KES ${parseFloat(permit.fee_paid).toLocaleString()}`);
      addField('Effective Date', permit.effective_date ? moment(permit.effective_date).format('DD/MM/YYYY') : 'N/A');
      addField('Expiry Date', permit.expiry_date ? moment(permit.expiry_date).format('DD/MM/YYYY') : 'N/A');

      doc.moveDown(1);

      // -----------------------------------------------------------------------
      // QR Code
      // -----------------------------------------------------------------------
      if (qrImagePath && fs.existsSync(qrImagePath)) {
        doc.image(qrImagePath, 70, doc.y, { width: 100, height: 100 });
        doc.fontSize(8).font('Helvetica').text('Scan to verify', 70, doc.y + 105);
      }

      // -----------------------------------------------------------------------
      // County Stamp Placeholder
      // -----------------------------------------------------------------------
      const stampX = 380;
      const stampY = doc.y - 120;
      doc.roundedRect(stampX, stampY, 140, 100, 5).stroke('#003366');
      doc.fontSize(10).font('Helvetica-Bold').text('COUNTY STAMP', stampX + 20, stampY + 35, { align: 'center', width: 100 });
      doc.fontSize(8).font('Helvetica').text('(Official Stamp Here)', stampX + 20, stampY + 55, { align: 'center', width: 100 });

      // -----------------------------------------------------------------------
      // Footer
      // -----------------------------------------------------------------------
      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#003366');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text(
        'This permit is issued under the West Pokot County Finance Act and is subject to the terms and conditions therein.',
        50,
        doc.y,
        { align: 'center', width: 500 }
      );
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica-Oblique').text(
        `Issued on: ${permit.issued_at ? moment(permit.issued_at).format('DD/MM/YYYY HH:mm') : 'N/A'} | Verify at: https://westpokot.go.ke/verify/${permit.permit_id}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePermitPDF };
