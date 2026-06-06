const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Taxonomy model - categories and tags for content classification.
 * Supports hierarchical categories via parent_id self-reference.
 */
const Taxonomy = sequelize.define('Taxonomy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('category', 'tag'),
    allowNull: false,
    defaultValue: 'category',
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'taxonomies',
      key: 'id',
    },
  },
}, {
  tableName: 'taxonomies',
  indexes: [
    {
      unique: true,
      fields: ['type', 'slug'],
      name: 'taxonomy_type_slug_unique',
    },
    {
      fields: ['type'],
      name: 'taxonomy_type_idx',
    },
    {
      fields: ['parent_id'],
      name: 'taxonomy_parent_idx',
    },
  ],
});

// Self-referencing relationship for hierarchical categories
Taxonomy.belongsTo(Taxonomy, {
  foreignKey: 'parent_id',
  as: 'parent',
});

Taxonomy.hasMany(Taxonomy, {
  foreignKey: 'parent_id',
  as: 'children',
});

module.exports = Taxonomy;
