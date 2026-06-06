const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityAssistant model - Community Health Assistants (CHAs).
 * Government health workers who supervise CHVs.
 */
const HealthCommunityAssistant = sequelize.define('HealthCommunityAssistant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: { model: 'employees', key: 'id' },
    comment: 'Links to HR employee record',
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  national_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sub_county: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  assigned_units: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of CHUs supervised',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_community_assistants',
  timestamps: true,
  indexes: [
    { fields: ['national_id'] },
    { fields: ['employee_id'] },
    { fields: ['sub_county'] },
  ],
});

module.exports = HealthCommunityAssistant;
