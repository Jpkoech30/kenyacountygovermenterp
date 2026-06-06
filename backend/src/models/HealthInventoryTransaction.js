const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthInventoryTransaction model - records stock movements.
 * Automatically adjusts inventory item stock levels on creation.
 */
const HealthInventoryTransaction = sequelize.define('HealthInventoryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_inventory_items', key: 'id' },
  },
  transaction_type: {
    type: DataTypes.ENUM('receipt', 'issue', 'adjustment', 'return'),
    allowNull: false,
    comment: 'receipt = stock in, issue = stock out, adjustment = correction, return = returned to supplier',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Positive for receipt/return, negative for issue/adjustment-down',
  },
  reference: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Purchase order number, patient visit ID, or other reference',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'health_inventory_transactions',
  timestamps: true,
  updatedAt: false, // Transactions are immutable once created
  indexes: [
    { fields: ['item_id'] },
    { fields: ['transaction_type'] },
    { fields: ['created_by'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = HealthInventoryTransaction;
