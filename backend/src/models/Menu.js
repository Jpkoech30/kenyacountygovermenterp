const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Menu model - defines navigation menus (e.g., "Main Menu", "Footer Menu").
 * Each menu has a location (header, footer) and contains menu items.
 */
const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  location: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['header', 'footer']],
    },
  },
}, {
  tableName: 'menus',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['location'],
      name: 'menus_location_unique',
    },
  ],
});

module.exports = Menu;
