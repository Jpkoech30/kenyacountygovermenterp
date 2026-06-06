const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PerformanceReview model - employee performance appraisals.
 * Workflow: draft → submitted → acknowledged → completed.
 * Rated on a 1-5 scale by the reviewer (usually supervisor).
 */
const PerformanceReview = sequelize.define('PerformanceReview', {
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
  reviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'Supervisor or HR officer conducting the review',
  },
  review_period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  review_period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  goals_achieved: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  strengths: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  areas_improvement: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  overall_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
    comment: 'Overall rating from 1 (poor) to 5 (excellent)',
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'acknowledged', 'completed'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'performance_reviews',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['reviewer_id'] },
    { fields: ['status'] },
  ],
});

module.exports = PerformanceReview;
