const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PermitAssignment model - tracks assignment of paid permits to clerks for processing.
 * Revenue officers assign; clerks process and mark as completed.
 */
const PermitAssignment = sequelize.define('PermitAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  permit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'permits', key: 'id' },
    unique: true,
    comment: 'One active assignment per permit',
  },
  clerk_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'permit_assignments',
  timestamps: true,
  underscored: true,
});

module.exports = PermitAssignment;
