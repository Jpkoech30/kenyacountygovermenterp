const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * LlmUsageLog model - tracks AI summarisation usage and costs.
 * Records token counts and calculates cost in KES for auditing.
 * Exchange rate: 129.59 KES/USD
 * Pricing: $0.435/1M input tokens, $0.87/1M output tokens
 */
const LlmUsageLog = sequelize.define('LlmUsageLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'content',
      key: 'id',
    },
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Target locale for the summary',
  },
  feature: {
    type: DataTypes.ENUM('grammar', 'translate', 'tags', 'seo', 'alt', 'improve', 'summarise', 'content_assistant'),
    allowNull: false,
    defaultValue: 'summarise',
    comment: 'Which AI feature was used',
  },
  input_tokens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  output_tokens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  cost_kes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Cost in Kenyan Shillings',
  },
}, {
  tableName: 'llm_usage_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id'],
      name: 'llm_usage_user_idx',
    },
    {
      fields: ['content_id'],
      name: 'llm_usage_content_idx',
    },
    {
      fields: ['createdAt'],
      name: 'llm_usage_created_idx',
    },
  ],
});

module.exports = LlmUsageLog;
