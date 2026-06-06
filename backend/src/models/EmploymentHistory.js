const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * EmploymentHistory model - immutable audit trail of employee position changes.
 * Records every change in position, department, or supervisor.
 * Once created, records should NOT be modified (immutable).
 */
const EmploymentHistory = sequelize.define('EmploymentHistory', {
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
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date this position/assignment became effective',
  },
  effective_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date this position/assignment ended (null if current)',
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
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'employees', key: 'id' },
  },
  change_reason: {
    type: DataTypes.ENUM(
      'new_hire', 'promotion', 'transfer', 'demotion',
      'reshuffle', 'resignation', 'termination', 'retirement'
    ),
    allowNull: false,
  },
  document_attachment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'media', key: 'id' },
    comment: 'Supporting document (appointment letter, etc.)',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'User who recorded this history entry',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'employment_history',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['position_id'] },
    { fields: ['department_id'] },
    { fields: ['effective_from'] },
  ],
});

module.exports = EmploymentHistory;
