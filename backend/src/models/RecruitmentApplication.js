const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * RecruitmentApplication model - citizen applications for published vacancies.
 * Workflow: submitted → shortlisted → interviewed → offered → hired/rejected.
 */
const RecruitmentApplication = sequelize.define('RecruitmentApplication', {
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
  applicant_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  cover_letter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cv_attachment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'media', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('submitted', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'),
    defaultValue: 'submitted',
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'HR officer assigned to review this application',
  },
  interview_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  offer_letter_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'media', key: 'id' },
  },
  hired_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date applicant was hired (auto-creates employee record)',
  },
  shortlisting_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score assigned during shortlisting (qualification matching)',
  },
  shortlisting_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HR officer comments during shortlisting review',
  },
  elimination_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for elimination if rejected during shortlisting',
  },
}, {
  tableName: 'recruitment_applications',
  timestamps: true,
  indexes: [
    { fields: ['vacancy_id'] },
    { fields: ['status'] },
    { fields: ['email'] },
  ],
});

module.exports = RecruitmentApplication;
