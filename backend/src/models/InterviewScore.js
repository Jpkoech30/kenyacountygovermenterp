const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * InterviewScore model - per-candidate interview scoring by panel members.
 * Scores are 0-100. Each panel member can submit one score per application.
 */
const InterviewScore = sequelize.define('InterviewScore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recruitment_applications', key: 'id' },
    onDelete: 'CASCADE',
  },
  panel_member_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'panel_members', key: 'id' },
    onDelete: 'CASCADE',
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
    comment: 'Interview score out of 100',
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Panel member comments on the candidate',
  },
}, {
  tableName: 'interview_scores',
  timestamps: true,
  indexes: [
    { fields: ['application_id'] },
    { fields: ['panel_member_id'] },
    { unique: true, fields: ['application_id', 'panel_member_id'], name: 'unique_score_per_member' },
  ],
});

module.exports = InterviewScore;
