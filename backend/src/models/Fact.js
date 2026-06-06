const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Fact model - county facts and statistics displayed on the public website.
 * Supports multilingual text and can be toggled active/inactive.
 */
const Fact = sequelize.define('Fact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  text_en: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  text_sw: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  text_pok: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'facts',
  indexes: [
    {
      fields: ['active'],
      name: 'facts_active_idx',
    },
    {
      fields: ['sort_order'],
      name: 'facts_sort_order_idx',
    },
  ],
});

module.exports = Fact;
