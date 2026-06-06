const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * VacancyRequest model - approval workflow for publishing vacancies.
 * Department heads request vacancies; HR/board approves before publishing.
 * Workflow: pending → approved → vacancy auto-published / rejected.
 */
const VacancyRequest = sequelize.define('VacancyRequest', {
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
  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'Department head who requested the vacancy',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  approval_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from the approver (rejection reason or approval conditions)',
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'HR officer or admin who approved/rejected',
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'vacancy_requests',
  timestamps: true,
  indexes: [
    { fields: ['vacancy_id'] },
    { fields: ['status'] },
    { fields: ['requested_by'] },
  ],
});

module.exports = VacancyRequest;
