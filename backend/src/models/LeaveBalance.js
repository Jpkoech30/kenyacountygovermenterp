const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * LeaveBalance model - tracks annual leave entitlement and usage per employee per year.
 * Permanent employees: 21 days/year
 * Contract employees: 0.5 days/month (6 days/year)
 */
const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'employees', key: 'id' },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Calendar year e.g., 2026',
  },
  days_entitled: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total days entitled for the year',
  },
  days_taken: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    comment: 'Days already taken/approved',
  },
  days_remaining: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    comment: 'Days still available (entitled - taken)',
  },
}, {
  tableName: 'leave_balances',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['year'] },
    { unique: true, fields: ['employee_id', 'year'] },
  ],
});

module.exports = LeaveBalance;
