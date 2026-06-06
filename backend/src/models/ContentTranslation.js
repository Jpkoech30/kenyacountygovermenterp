const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ContentTranslation model - stores multilingual content for each locale.
 * Each content item can have translations in en, sw, and pok.
 */
const ContentTranslation = sequelize.define('ContentTranslation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id',
    },
  },
  locale: {
    type: DataTypes.ENUM('en', 'sw', 'pok'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  featured_image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
    },
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  meta_keywords: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'content_translations',
  indexes: [
    {
      unique: true,
      fields: ['content_id', 'locale'],
      name: 'content_translation_unique',
    },
    {
      fields: ['locale'],
      name: 'content_translation_locale_idx',
    },
  ],
});

module.exports = ContentTranslation;
