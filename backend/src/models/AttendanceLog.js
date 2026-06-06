const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AttendanceLog model - employee check-in/check-out records.
 * Supports GPS location capture for web/mobile check-ins.
 */
const AttendanceLog = sequelize.define('AttendanceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'employees', key: 'id' },
  },
  check_in: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  check_out: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  gps_latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  gps_longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  source: {
    type: DataTypes.ENUM('web', 'mobile_app', 'biometric'),
    defaultValue: 'web',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['check_in'] },
  ],
});

module.exports = AttendanceLog;
