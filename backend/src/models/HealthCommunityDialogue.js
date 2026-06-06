const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityDialogue model - community dialogue days.
 * Structured community engagement sessions for health education and feedback.
 */
const HealthCommunityDialogue = sequelize.define('HealthCommunityDialogue', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  venue: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Main discussion topic',
  },
  facilitator: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  total_attendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  male_attendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  female_attendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  youth_attendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  key_discussion_points: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  action_items: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of action items',
  },
  status: {
    type: DataTypes.ENUM('planned', 'completed', 'cancelled'),
    defaultValue: 'planned',
  },
}, {
  tableName: 'health_community_dialogues',
  timestamps: true,
  indexes: [
    { fields: ['community_unit_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthCommunityDialogue;
