const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentMedia model - junction table linking content to media files.
 * Allows ordering of media attachments per content item.
 */
const ContentMedia = sequelize.define('ContentMedia', {
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
  media_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'media',
      key: 'id',
    },
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'content_media',
  indexes: [
    {
      unique: true,
      fields: ['content_id', 'media_id'],
      name: 'content_media_unique',
    },
    {
      fields: ['content_id'],
      name: 'content_media_content_idx',
    },
  ],
});

module.exports = ContentMedia;
