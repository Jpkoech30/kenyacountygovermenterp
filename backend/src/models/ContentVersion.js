const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentVersion model - stores JSON snapshots of content state.
 * Created on every update to allow rollback to previous versions.
 * Keeps the last 10 versions per content item (managed by application logic).
 */
const ContentVersion = sequelize.define('ContentVersion', {
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
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'content_versions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['content_id', 'version_number'],
      name: 'content_version_unique',
      unique: true,
    },
    {
      fields: ['content_id'],
      name: 'content_version_content_idx',
    },
  ],
});

module.exports = ContentVersion;
