const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthHouseholdMember model - individual members of a household.
 * Auto-links to HealthPatient by national_id when possible.
 */
const HealthHouseholdMember = sequelize.define('HealthHouseholdMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  household_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_households', key: 'id' },
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  national_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Used to auto-link to HealthPatient',
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  relationship_to_head: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g. self, spouse, child, parent',
  },
  is_head: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  education_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  occupation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_pregnant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  has_chronic_illness: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  chronic_illness_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_disabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  disability_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_household_members',
  timestamps: true,
  indexes: [
    { fields: ['household_id'] },
    { fields: ['national_id'] },
    { fields: ['is_head'] },
  ],
});

module.exports = HealthHouseholdMember;
