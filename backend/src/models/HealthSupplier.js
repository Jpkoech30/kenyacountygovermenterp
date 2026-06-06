const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthSupplier model - vendors supplying medicines and equipment.
 */
const HealthSupplier = sequelize.define('HealthSupplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_suppliers',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
  ],
});

module.exports = HealthSupplier;
