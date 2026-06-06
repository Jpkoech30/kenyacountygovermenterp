const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PanelMember model - individual member of an interview panel.
 * Each member has a role: chairperson, secretary, or member.
 */
const PanelMember = sequelize.define('PanelMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  panel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'interview_panels', key: 'id' },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  role: {
    type: DataTypes.ENUM('chairperson', 'secretary', 'member'),
    defaultValue: 'member',
  },
}, {
  tableName: 'panel_members',
  timestamps: true,
  indexes: [
    { fields: ['panel_id'] },
    { fields: ['user_id'] },
    { unique: true, fields: ['panel_id', 'user_id'], name: 'unique_panel_member' },
  ],
});

module.exports = PanelMember;
