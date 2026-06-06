const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthPatient model - patients registered at county health facilities.
 * Supports family health tracking via mother_national_id and father_national_id
 * for linking child patients to their parents using Kenyan National IDs.
 */
const HealthPatient = sequelize.define('HealthPatient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  national_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Kenyan National ID number',
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sub_location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to locations table (future)',
  },
  mother_national_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Mother\'s Kenyan National ID (for family health tracking)',
  },
  father_national_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Father\'s Kenyan National ID (for family health tracking)',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_patients',
  timestamps: true,
  indexes: [
    { fields: ['national_id'] },
    { fields: ['phone'] },
    { fields: ['first_name', 'last_name'] },
    { fields: ['mother_national_id'] },
    { fields: ['father_national_id'] },
  ],
});

module.exports = HealthPatient;
