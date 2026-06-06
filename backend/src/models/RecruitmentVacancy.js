const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * RecruitmentVacancy model - job vacancies published for public recruitment.
 * Workflow: draft → published → closed → filled.
 */
const RecruitmentVacancy = sequelize.define('RecruitmentVacancy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'departments', key: 'id' },
  },
  position_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'positions', key: 'id' },
  },
  employment_type: {
    type: DataTypes.ENUM('permanent', 'contract', 'casual', 'intern', 'seconded'),
    allowNull: false,
    defaultValue: 'permanent',
  },
  job_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  no_of_posts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  application_deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed', 'filled'),
    defaultValue: 'draft',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'recruitment_vacancies',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['department_id'] },
    { fields: ['application_deadline'] },
  ],
});

module.exports = RecruitmentVacancy;
