const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * LeaveRequest model - employee leave applications.
 * Supports annual, sick, compassionate, unpaid, study, maternity, paternity leave.
 * Workflow: pending → approved/rejected/cancelled.
 */
const LeaveRequest = sequelize.define('LeaveRequest', {
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
  leave_type: {
    type: DataTypes.ENUM('annual', 'sick', 'compassionate', 'unpaid', 'study', 'maternity', 'paternity'),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Calculated as end_date - start_date + 1',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending',
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  approval_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'leave_requests',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['status'] },
    { fields: ['leave_type'] },
  ],
});

module.exports = LeaveRequest;
