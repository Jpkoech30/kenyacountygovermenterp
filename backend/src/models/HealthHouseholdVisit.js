const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HealthHouseholdVisit model - CHV household visit records.
 * Tracks visit outcomes, health education, and referrals.
 */
const HealthHouseholdVisit = sequelize.define('HealthHouseholdVisit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  household_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_households', key: 'id' },
  },
  chv_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'health_community_volunteers', key: 'id' },
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  visit_type: {
    type: DataTypes.ENUM('routine', 'follow_up', 'emergency', 'referral_follow_up'),
    defaultValue: 'routine',
  },
  household_condition: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'General observations about the household',
  },
  health_education_provided: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  health_education_topic: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  children_under_5_checked: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pregnant_women_identified: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  referrals_made: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  referral_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of referral objects',
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_household_visits',
  timestamps: true,
  indexes: [
    { fields: ['household_id'] },
    { fields: ['chv_id'] },
    { fields: ['visit_date'] },
    { fields: ['visit_type'] },
    { fields: ['follow_up_required'] },
  ],
});

module.exports = HealthHouseholdVisit;
