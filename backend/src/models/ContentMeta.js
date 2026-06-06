const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentMeta model - key-value metadata for content items.
 * Allows flexible additional data without schema changes.
 */
const ContentMeta = sequelize.define('ContentMeta', {
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
  meta_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  meta_value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'content_meta',
  indexes: [
    {
      fields: ['content_id', 'meta_key'],
      name: 'content_meta_key_idx',
    },
  ],
});

module.exports = ContentMeta;
