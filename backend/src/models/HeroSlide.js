const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * HeroSlide model - rotating hero slides displayed on the public website homepage.
 * Simple CRUD with no workflow (direct publish).
 */
const HeroSlide = sequelize.define('HeroSlide', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  image_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'media',
      key: 'id',
    },
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'hero_slides',
  indexes: [
    {
      fields: ['sort_order'],
      name: 'hero_slides_sort_order_idx',
    },
    {
      fields: ['active'],
      name: 'hero_slides_active_idx',
    },
  ],
});

module.exports = HeroSlide;
