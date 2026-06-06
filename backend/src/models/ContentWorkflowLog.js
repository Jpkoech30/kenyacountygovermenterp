const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentWorkflowLog model - audit trail for content status changes.
 * Records every transition in the content workflow lifecycle.
 */
const ContentWorkflowLog = sequelize.define('ContentWorkflowLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id',
    },
  },
  from_status: {
    type: DataTypes.ENUM(
      'draft',
      'pending_review',
      'approved',
      'scheduled',
      'published',
      'archived'
    ),
    allowNull: true,
  },
  to_status: {
    type: DataTypes.ENUM(
      'draft',
      'pending_review',
      'approved',
      'scheduled',
      'published',
      'archived'
    ),
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'content_workflow_logs',
  timestamps: true,
  updatedAt: false, // Only createdAt is relevant for audit logs
  indexes: [
    {
      fields: ['content_id'],
      name: 'workflow_log_content_idx',
    },
    {
      fields: ['user_id'],
      name: 'workflow_log_user_idx',
    },
    {
      fields: ['createdAt'],
      name: 'workflow_log_created_idx',
    },
  ],
});

module.exports = ContentWorkflowLog;
