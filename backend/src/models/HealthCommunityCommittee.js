const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityCommittee model - Community Health Committee members.
 */
const HealthCommunityCommittee = sequelize.define('HealthCommunityCommittee', {
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
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g. chairperson, secretary, treasurer, member',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  elected_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  term_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_community_committees',
  timestamps: true,
  indexes: [
    { fields: ['community_unit_id'] },
    { fields: ['role'] },
  ],
});

module.exports = HealthCommunityCommittee;
