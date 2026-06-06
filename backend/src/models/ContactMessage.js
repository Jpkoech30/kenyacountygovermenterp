const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'contact_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'contact_messages_is_read_idx',
      fields: ['is_read'],
    },
    {
      name: 'contact_messages_created_at_idx',
      fields: ['created_at'],
    },
  ],
})

module.exports = ContactMessage
