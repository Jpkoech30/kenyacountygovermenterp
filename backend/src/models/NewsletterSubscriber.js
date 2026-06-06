const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  subscribed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'newsletter_subscribers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'newsletter_subscribers_email_idx',
      fields: ['email'],
    },
    {
      name: 'newsletter_subscribers_is_active_idx',
      fields: ['is_active'],
    },
  ],
})

module.exports = NewsletterSubscriber
