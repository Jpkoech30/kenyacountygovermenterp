const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Position model - job positions/designations within the county.
 * Each position belongs to a department and has a job grade.
 */
const Position = sequelize.define('Position', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    comment: 'Job title e.g., County Clerk, Revenue Officer',
  },
  job_grade: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Job group/grade e.g., JG-P, JG-Q, CPSB 1',
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'departments', key: 'id' },
    comment: 'Default department for this position',
  },
  job_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'positions',
  timestamps: true,
  indexes: [
    { fields: ['title'] },
    { fields: ['department_id'] },
  ],
});

module.exports = Position;
