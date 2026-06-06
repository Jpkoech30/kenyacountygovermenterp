const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityVolunteer model - Community Health Volunteers (CHVs).
 * Frontline community health workers assigned to households.
 */
const HealthCommunityVolunteer = sequelize.define('HealthCommunityVolunteer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  community_unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_community_units', key: 'id' },
  },
  cha_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_community_assistants', key: 'id' },
    comment: 'Supervising CHA',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: { model: 'users', key: 'id' },
    comment: 'Linked system user account for CHV login',
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
  village: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  household_assignments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of assigned households',
  },
  training_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. basic, intermediate, advanced',
  },
  trained_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  certification_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
  },
}, {
  tableName: 'health_community_volunteers',
  timestamps: true,
  indexes: [
    { fields: ['community_unit_id'] },
    { fields: ['cha_id'] },
    { fields: ['user_id'] },
    { fields: ['national_id'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthCommunityVolunteer;
