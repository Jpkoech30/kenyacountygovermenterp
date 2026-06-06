const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Content model - core entity for the CMS module.
 * Supports multiple content types (page, news, event, etc.)
 * and a full workflow lifecycle (draft -> pending_review -> approved -> published).
 * Uses paranoid (soft delete) via deleted_at.
 */
const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM(
      'page',
      'news',
      'event',
      'department_notice',
      'press_release',
      'tender',
      'vacancy',
      'department',
      'person'
    ),
    allowNull: false,
    defaultValue: 'page',
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'pending_review',
      'approved',
      'scheduled',
      'published',
      'archived'
    ),
    allowNull: false,
    defaultValue: 'draft',
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  publisher_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'scheduled'),
    defaultValue: 'public',
    allowNull: false,
    comment: 'Controls public visibility: public=visible, private=hidden, scheduled=date-range',
  },
  visible_from: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Start date for scheduled visibility',
  },
  visible_to: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'End date for scheduled visibility',
  },
  manually_hidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Admin can manually hide published content without unpublishing',
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'content',
  paranoid: true, // Enables soft delete via deleted_at
  indexes: [
    {
      unique: true,
      fields: ['type', 'slug'],
      name: 'content_type_slug_unique',
    },
    {
      fields: ['status'],
      name: 'content_status_idx',
    },
    {
      fields: ['author_id'],
      name: 'content_author_idx',
    },
    {
      fields: ['published_at'],
      name: 'content_published_at_idx',
    },
    {
      fields: ['visibility'],
      name: 'content_visibility_idx',
    },
    {
      fields: ['visible_from'],
      name: 'content_visible_from_idx',
    },
    {
      fields: ['visible_to'],
      name: 'content_visible_to_idx',
    },
    {
      fields: ['manually_hidden'],
      name: 'content_manually_hidden_idx',
    },
  ],
});

module.exports = Content;
