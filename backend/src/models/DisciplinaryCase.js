const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * DisciplinaryCase model - employee disciplinary actions.
 * Supports warnings, suspension, demotion, and termination cases.
 */
const DisciplinaryCase = sequelize.define('DisciplinaryCase', {
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
  case_type: {
    type: DataTypes.ENUM('warning', 'suspension', 'demotion', 'termination'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  decision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Final decision/outcome of the case',
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  closed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of media IDs or document references',
  },
}, {
  tableName: 'disciplinary_cases',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['status'] },
    { fields: ['case_type'] },
  ],
});

module.exports = DisciplinaryCase;
