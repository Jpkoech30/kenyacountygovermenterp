const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CitizenRepresentation model - optional, for cyber providers
 * who apply for permits on behalf of citizens.
 * Stores consent records for audit compliance.
 */
const CitizenRepresentation = sequelize.define('CitizenRepresentation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  provider_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  permit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'permits', key: 'id' },
  },
  citizen_national_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  citizen_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  consent_signed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  consent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'citizen_representations',
  timestamps: true,
  underscored: true,
});

module.exports = CitizenRepresentation;
