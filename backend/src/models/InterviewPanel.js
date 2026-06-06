const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * InterviewPanel model - panel assigned to conduct interviews for a vacancy.
 * A panel has a chairperson and multiple members.
 */
const InterviewPanel = sequelize.define('InterviewPanel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vacancy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recruitment_vacancies', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Panel name (e.g., "ICT Interview Panel 2025")',
  },
  chairperson_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Chairperson of the panel',
  },
  status: {
    type: DataTypes.ENUM('active', 'dissolved'),
    defaultValue: 'active',
  },
}, {
  tableName: 'interview_panels',
  timestamps: true,
  indexes: [
    { fields: ['vacancy_id'] },
    { fields: ['status'] },
  ],
});

module.exports = InterviewPanel;
