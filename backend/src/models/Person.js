const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Person model - county leadership profiles (Governor, Deputy, CECs, etc.).
 * Supports multilingual bios and social media links.
 * Linked to content for future person-specific pages.
 */
const Person = sequelize.define('Person', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'content',
      key: 'id',
    },
    comment: 'Optional link to a content page for this person',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Optional link to a user account for ERP login',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'e.g., Governor, Deputy Governor, CEC',
  },
  photo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
    },
  },
  bio_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bio_sw: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bio_pok: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  social_links: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object with social media URLs',
  },
}, {
  tableName: 'persons',
  indexes: [
    {
      fields: ['sort_order'],
      name: 'persons_sort_order_idx',
    },
    {
      fields: ['content_id'],
      name: 'persons_content_idx',
    },
  ],
});

module.exports = Person;
