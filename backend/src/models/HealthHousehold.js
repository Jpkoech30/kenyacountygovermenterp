const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthHousehold model - a household unit within a community.
 * Tracks demographics, infrastructure, and assigned CHV.
 */
const HealthHousehold = sequelize.define('HealthHousehold', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  community_unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_community_units', key: 'id' },
  },
  chv_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_community_volunteers', key: 'id' },
    comment: 'Assigned CHV',
  },
  household_head: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Name of household head',
  },
  household_number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated: HH-{CHU_CODE}-{SEQUENTIAL}',
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  sub_location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  family_size: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  number_of_rooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  has_electricity: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  has_improved_sanitation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  main_water_source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. piped, well, river, borehole',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'closed'),
    defaultValue: 'active',
  },
}, {
  tableName: 'health_households',
  timestamps: true,
  indexes: [
    { fields: ['community_unit_id'] },
    { fields: ['chv_id'] },
    { fields: ['household_number'] },
    { fields: ['village'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthHousehold;
