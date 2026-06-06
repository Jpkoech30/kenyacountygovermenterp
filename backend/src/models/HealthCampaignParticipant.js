const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCampaignParticipant model - tracks patients served in a campaign.
 * Links a campaign to a patient visit for coverage tracking.
 */
const HealthCampaignParticipant = sequelize.define('HealthCampaignParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_campaigns', key: 'id' },
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_patients', key: 'id' },
  },
  date_served: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_campaign_participants',
  timestamps: true,
  indexes: [
    { fields: ['campaign_id'] },
    { fields: ['patient_id'] },
    { fields: ['date_served'] },
  ],
});

module.exports = HealthCampaignParticipant;
