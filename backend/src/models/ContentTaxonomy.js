const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentTaxonomy model - junction table linking content to taxonomies.
 * Allows content to have multiple categories and tags.
 */
const ContentTaxonomy = sequelize.define('ContentTaxonomy', {
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
  taxonomy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'taxonomies',
      key: 'id',
    },
  },
}, {
  tableName: 'content_taxonomies',
  indexes: [
    {
      unique: true,
      fields: ['content_id', 'taxonomy_id'],
      name: 'content_taxonomy_unique',
    },
    {
      fields: ['taxonomy_id'],
      name: 'content_taxonomy_taxonomy_idx',
    },
  ],
});

module.exports = ContentTaxonomy;
