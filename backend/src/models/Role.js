const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Role model - defines access levels in the ERP system.
 * The 10 roles cover all user types in West Pokot County Government.
 */
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isIn: [
        [
          'admin',
          'editor',
          'revenue_officer',
          'revenue_clerk',
          'cyber_provider',
          'hr_officer',
          'supervisor',
          'employee',
          'health_officer',
          'health_worker',
          'health_manager',
          'health_records_officer',
          'pharmacy_tech',
          'community_health_officer',
          'chv',
        ],
      ],
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'roles',
});

module.exports = Role;
