const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * MenuItem model - individual links within a navigation menu.
 * Supports parent/child nesting for dropdown sub-menus.
 * Title is stored as JSON for multilingual support: {"en": "...", "sw": "...", "pok": "..."}
 */
const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  menu_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menus',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'menu_items',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  title: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('page', 'category', 'custom_url', 'external_link'),
    allowNull: false,
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to contents.id (if type=page) or taxonomies.id (if type=category)',
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Used when type=custom_url or external_link',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'menu_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['menu_id'],
      name: 'menu_items_menu_id',
    },
    {
      fields: ['parent_id'],
      name: 'menu_items_parent_id',
    },
    {
      fields: ['sort_order'],
      name: 'menu_items_sort_order',
    },
  ],
});

module.exports = MenuItem;
