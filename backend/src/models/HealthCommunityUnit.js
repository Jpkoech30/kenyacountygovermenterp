const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityUnit model - Community Health Unit (CHU).
 * The foundational organizational unit for community health services.
 */
const HealthCommunityUnit = sequelize.define('HealthCommunityUnit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Unique CHU code, e.g. CHU-001',
  },
  ward: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Administrative ward',
  },
  sub_county: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  established_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  total_households: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Target household count',
  },
  total_chvs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Target CHV count',
  },
}, {
  tableName: 'health_community_units',
  timestamps: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['ward'] },
    { fields: ['sub_county'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthCommunityUnit;
