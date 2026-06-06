const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Department model - represents county government departments.
 * Supports hierarchical structure via self-referencing parent_department_id.
 */
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  parent_department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
  },
}, {
  tableName: 'departments',
});

// Self-referencing association for department hierarchy
Department.belongsTo(Department, {
  as: 'parentDepartment',
  foreignKey: 'parent_department_id',
});

Department.hasMany(Department, {
  as: 'subDepartments',
  foreignKey: 'parent_department_id',
});

module.exports = Department;
