const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthInventoryItem model - medicines, consumables, and equipment.
 * Tracks current stock levels and reorder thresholds.
 */
const HealthInventoryItem = sequelize.define('HealthInventoryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique item code (e.g., stock-keeping code)',
  },
  category: {
    type: DataTypes.ENUM('consumables', 'pharmaceuticals', 'equipment'),
    allowNull: false,
    defaultValue: 'consumables',
  },
  unit_of_measure: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pieces',
    comment: 'e.g., pieces, boxes, litres, packs',
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'System alerts when current_stock falls below this level',
  },
  current_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Current quantity on hand',
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Null for non-expiring items (equipment)',
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_suppliers', key: 'id' },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_inventory_items',
  timestamps: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['category'] },
    { fields: ['supplier_id'] },
  ],
});

module.exports = HealthInventoryItem;
