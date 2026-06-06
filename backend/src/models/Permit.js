const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Permit model - core entity for business permits and licenses.
 * Tracks the full lifecycle: draft → pending_payment → paid → active → expired/renewed.
 */
const Permit = sequelize.define('Permit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  permit_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'permit_types', key: 'id' },
  },
  permit_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Human-readable unique ID e.g., SBP-2F0366F2',
  },
  applicant_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  applicant_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  applicant_email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  kra_pin: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  business_activity: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  activity_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  employee_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  fee_paid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  effective_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  sub_county: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ward: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  plot_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  road_street: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  building: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  floor: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  door_stall_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_payment', 'paid', 'active', 'expired', 'renewed'),
    defaultValue: 'draft',
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Base64-encoded QR code image or URL',
  },
  issued_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  renewed_from_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Links to previous permit on renewal',
  },
}, {
  tableName: 'permits',
  timestamps: true,
  underscored: true,
});

module.exports = Permit;
