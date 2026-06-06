const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AppointmentLetter model - generated appointment letters for hired applicants.
 * Letters are generated as PDFs using pdfkit and stored with metadata.
 * Workflow: draft → issued → signed.
 */
const AppointmentLetter = sequelize.define('AppointmentLetter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recruitment_applications', key: 'id' },
  },
  letter_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated format: HR-APP-YYYY-NNNN',
  },
  content: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Letter data (applicant details, terms, salary, etc.) stored as JSON',
  },
  pdf_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Relative path to the generated PDF file on disk',
  },
  status: {
    type: DataTypes.ENUM('draft', 'issued', 'signed'),
    defaultValue: 'draft',
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  issued_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  signed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  signed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'appointment_letters',
  timestamps: true,
  indexes: [
    { fields: ['application_id'] },
    { fields: ['status'] },
    { fields: ['letter_number'] },
  ],
});

module.exports = AppointmentLetter;
