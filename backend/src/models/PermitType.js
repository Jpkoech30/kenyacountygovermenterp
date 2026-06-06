const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PermitType model - defines categories of permits/licenses.
 * e.g., Single Business Permit, Health Certificate, etc.
 */
const PermitType = sequelize.define('PermitType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Short code e.g., SBP, HC',
  },
  fee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'permit_types',
  timestamps: true,
  underscored: true,
});

module.exports = PermitType;
