const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Employee model - core HR entity representing a county public servant.
 * Tracks employment details, contract dates, and current status.
 * Linked to a User account (optional) for system access.
 */
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: { model: 'users', key: 'id' },
    comment: 'Linked system user account (optional for non-system users)',
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
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  marital_status: {
    type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Work email address',
  },
  personal_email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  position_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'positions', key: 'id' },
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'departments', key: 'id' },
  },
  employment_type: {
    type: DataTypes.ENUM('permanent', 'contract', 'casual', 'intern', 'seconded'),
    allowNull: false,
    defaultValue: 'permanent',
  },
  contract_start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  contract_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Null for permanent employees',
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'employees', key: 'id' },
    comment: 'Immediate supervisor (self-referencing)',
  },
  profile_photo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'media', key: 'id' },
  },
  bank_account: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  kra_pin: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  nssf_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  nhif_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'on_leave', 'suspended', 'terminated', 'retired'),
    defaultValue: 'active',
  },
}, {
  tableName: 'employees',
  timestamps: true,
  indexes: [
    { fields: ['national_id'] },
    { fields: ['user_id'] },
    { fields: ['department_id'] },
    { fields: ['position_id'] },
    { fields: ['supervisor_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Employee;
