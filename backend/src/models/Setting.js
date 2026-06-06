const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Setting model - key-value store for admin-configurable settings.
 * Used for LLM configuration, site metadata, feature flags, etc.
 */
const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'settings',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: false, // Only track last update time
  indexes: [
    {
      unique: true,
      fields: ['key'],
      name: 'settings_key_unique',
    },
  ],
});

module.exports = Setting;
