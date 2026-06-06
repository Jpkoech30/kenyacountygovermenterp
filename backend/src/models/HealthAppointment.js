const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthAppointment model - scheduled patient appointments with doctors.
 */
const HealthAppointment = sequelize.define('HealthAppointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_patients', key: 'id' },
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'employees', key: 'id' },
    comment: 'FK to employees table (health worker)',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_appointments',
  timestamps: true,
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['appointment_date'] },
    { fields: ['doctor_id'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthAppointment;
