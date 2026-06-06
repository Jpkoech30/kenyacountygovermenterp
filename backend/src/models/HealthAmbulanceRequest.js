const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthAmbulanceRequest model - emergency ambulance dispatch requests.
 */
const HealthAmbulanceRequest = sequelize.define('HealthAmbulanceRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'health_patients', key: 'id' },
    comment: 'Null if patient not yet registered',
  },
  patient_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Name if patient not registered',
  },
  pickup_location: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  destination: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  request_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  dispatch_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  arrival_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'en_route', 'arrived', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  assigned_driver_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'employees', key: 'id' },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_ambulance_requests',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['request_time'] },
    { fields: ['assigned_driver_id'] },
  ],
});

module.exports = HealthAmbulanceRequest;
