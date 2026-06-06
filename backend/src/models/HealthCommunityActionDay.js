const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCommunityActionDay model - community action days.
 * Mass health campaigns such as clean-ups, vaccination drives, screenings.
 */
const HealthCommunityActionDay = sequelize.define('HealthCommunityActionDay', {
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
  activity_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. clean_up, vaccination, screening, tree_planting',
  },
  venue: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  coordinator: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  total_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  resources_used: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of resources',
  },
  outcomes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('planned', 'completed', 'cancelled'),
    defaultValue: 'planned',
  },
}, {
  tableName: 'health_community_action_days',
  timestamps: true,
  indexes: [
    { fields: ['community_unit_id'] },
    { fields: ['date'] },
    { fields: ['activity_type'] },
    { fields: ['status'] },
  ],
});

module.exports = HealthCommunityActionDay;
