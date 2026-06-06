const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunitySupplyRequest model - CHV requests for supplies/kits.
 * Tracks the lifecycle of supply requests from submission to fulfillment.
 */
const HealthCommunitySupplyRequest = sequelize.define('HealthCommunitySupplyRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  chv_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_community_volunteers', key: 'id' },
  },
  kit_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_chv_kits', key: 'id' },
  },
  request_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'fulfilled', 'rejected'),
    defaultValue: 'pending',
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  approved_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fulfilled_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_community_supply_requests',
  timestamps: true,
  indexes: [
    { fields: ['chv_id'] },
    { fields: ['kit_id'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthCommunitySupplyRequest;
