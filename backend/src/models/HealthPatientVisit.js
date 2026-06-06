const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthPatientVisit model - records each patient visit to a health facility.
 * Includes diagnosis, treatment, and referral information.
 */
const HealthPatientVisit = sequelize.define('HealthPatientVisit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_patients', key: 'id' },
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  facility_type: {
    type: DataTypes.ENUM('outpatient', 'inpatient', 'emergency'),
    allowNull: false,
    defaultValue: 'outpatient',
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  referred_to: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Facility or department the patient was referred to',
  },
  referred_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  referral_source_chv_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_community_volunteers', key: 'id' },
    comment: 'CHV who made the referral (community health extension)',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'health_patient_visits',
  timestamps: true,
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['visit_date'] },
    { fields: ['facility_type'] },
    { fields: ['created_by'] },
  ],
});

module.exports = HealthPatientVisit;
