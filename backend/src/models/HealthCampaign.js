const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthCampaign model - public health campaigns (immunization, medical camps, etc.).
 */
const HealthCampaign = sequelize.define('HealthCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  campaign_type: {
    type: DataTypes.ENUM('immunization', 'medical_camp', 'screening', 'awareness'),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  target_locations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON array of sub_location_ids targeted by this campaign',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'health_campaigns',
  timestamps: true,
  indexes: [
    { fields: ['campaign_type'] },
    { fields: ['start_date', 'end_date'] },
  ],
});

module.exports = HealthCampaign;
