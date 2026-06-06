const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthChvKit model - CHV supply kit definitions.
 * Defines the types of kits available for CHVs (e.g. Basic Kit, Maternal Health Kit).
 */
const HealthChvKit = sequelize.define('HealthChvKit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kit_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. CHV Basic Kit, Maternal Health Kit',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  items_included: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of items in the kit',
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
}, {
  tableName: 'health_chv_kits',
  timestamps: true,
});

module.exports = HealthChvKit;
